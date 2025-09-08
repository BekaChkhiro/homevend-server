import { AppDataSource } from '../config/database.js';
import { Transaction, TransactionStatusEnum, TransactionTypeEnum } from '../models/Transaction.js';
import { User } from '../models/User.js';
import { BogPaymentService, BogPaymentDetails } from '../services/payments/BogPaymentService.js';
import { LessThan } from 'typeorm';

interface VerificationResult {
  transactionId: string;
  status: 'completed' | 'failed' | 'pending' | 'error';
  message: string;
  balanceUpdate?: {
    oldBalance: number;
    newBalance: number;
  };
}

/**
 * Process a single pending transaction
 */
async function processTransaction(
  transaction: Transaction,
  bogService: BogPaymentService
): Promise<VerificationResult> {
  const bogOrderId = transaction.metadata?.bogOrderId;
  
  if (!bogOrderId) {
    return {
      transactionId: transaction.uuid,
      status: 'error',
      message: 'No BOG order ID found'
    };
  }
  
  try {
    // Query BOG for payment status
    const paymentDetails = await bogService.getPaymentDetails(bogOrderId);
    const orderStatus = paymentDetails.order_status?.key as string;
    
    switch (orderStatus) {
      case 'completed':
        return await handleCompletedPayment(transaction, paymentDetails);
        
      case 'rejected':
        return await handleFailedPayment(transaction, orderStatus, paymentDetails.reject_reason);
        
      case 'created':
      case 'processing':
        return await handlePendingPayment(transaction, orderStatus);
        
      default:
        // Handle expired or other failed statuses
        if (orderStatus === 'expired') {
          return await handleFailedPayment(transaction, 'expired', 'Payment expired');
        }
        
        return {
          transactionId: transaction.uuid,
          status: 'error',
          message: `Unknown order status: ${orderStatus}`
        };
    }
  } catch (error: any) {
    return {
      transactionId: transaction.uuid,
      status: 'error',
      message: error.message
    };
  }
}

/**
 * Handle completed payment - update balance and transaction
 */
async function handleCompletedPayment(
  transaction: Transaction,
  paymentDetails: BogPaymentDetails
): Promise<VerificationResult> {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  
  try {
    const user = await queryRunner.manager.findOne(User, {
      where: { id: transaction.userId },
      select: ['id', 'balance']
    });
    
    if (!user) {
      await queryRunner.rollbackTransaction();
      return {
        transactionId: transaction.uuid,
        status: 'error',
        message: 'User not found'
      };
    }
    
    const currentBalance = parseFloat(user.balance.toString());
    const topUpAmount = parseFloat(transaction.amount.toString());
    const newBalance = currentBalance + topUpAmount;
    
    // Update user balance
    user.balance = newBalance;
    await queryRunner.manager.save(user);
    
    // Update transaction
    transaction.status = TransactionStatusEnum.COMPLETED;
    transaction.balanceAfter = newBalance;
    transaction.metadata = {
      ...transaction.metadata,
      verifiedAt: new Date().toISOString(),
      verificationMethod: 'automated_verification',
      bogPaymentStatus: 'completed',
      transferAmount: paymentDetails.purchase_units?.transfer_amount,
      bogTransactionId: paymentDetails.payment_detail?.transaction_id,
      paymentMethod: paymentDetails.payment_detail?.transfer_method?.key,
      cardType: paymentDetails.payment_detail?.card_type,
      payerIdentifier: paymentDetails.payment_detail?.payer_identifier
    };
    
    await queryRunner.manager.save(transaction);
    await queryRunner.commitTransaction();
    
    return {
      transactionId: transaction.uuid,
      status: 'completed',
      message: 'Payment verified and completed',
      balanceUpdate: {
        oldBalance: currentBalance,
        newBalance: newBalance
      }
    };
  } catch (error: unknown) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}

/**
 * Handle failed payment - mark transaction as failed
 */
async function handleFailedPayment(
  transaction: Transaction,
  orderStatus: string,
  rejectReason?: string
): Promise<VerificationResult> {
  const transactionRepository = AppDataSource.getRepository(Transaction);
  
  transaction.status = TransactionStatusEnum.FAILED;
  transaction.metadata = {
    ...transaction.metadata,
    verifiedAt: new Date().toISOString(),
    verificationMethod: 'automated_verification',
    bogPaymentStatus: orderStatus,
    rejectReason: rejectReason || 'Payment failed'
  };
  
  await transactionRepository.save(transaction);
  
  return {
    transactionId: transaction.uuid,
    status: 'failed',
    message: `Payment ${orderStatus}: ${rejectReason || 'Unknown reason'}`
  };
}

/**
 * Handle pending payment - check for timeout
 */
async function handlePendingPayment(
  transaction: Transaction,
  orderStatus: string
): Promise<VerificationResult> {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  
  if (transaction.createdAt < fifteenMinutesAgo) {
    const transactionRepository = AppDataSource.getRepository(Transaction);
    
    transaction.status = TransactionStatusEnum.FAILED;
    transaction.metadata = {
      ...transaction.metadata,
      verifiedAt: new Date().toISOString(),
      verificationMethod: 'automated_verification',
      bogPaymentStatus: orderStatus,
      failReason: 'Payment timeout - exceeded 15 minutes'
    };
    
    await transactionRepository.save(transaction);
    
    return {
      transactionId: transaction.uuid,
      status: 'failed',
      message: 'Payment timed out after 15 minutes'
    };
  }
  
  return {
    transactionId: transaction.uuid,
    status: 'pending',
    message: `Payment still ${orderStatus}`
  };
}

/**
 * Verify all pending BOG payments
 */
export async function verifyPendingBogPayments(): Promise<VerificationResult[]> {
  console.log('🔄 Starting BOG payments verification...');
  
  const results: VerificationResult[] = [];
  
  try {
    const transactionRepository = AppDataSource.getRepository(Transaction);
    
    // Find pending BOG transactions older than 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    
    const pendingTransactions = await transactionRepository.find({
      where: {
        type: TransactionTypeEnum.TOP_UP,
        status: TransactionStatusEnum.PENDING,
        paymentMethod: 'bog',
        createdAt: LessThan(twoMinutesAgo)
      },
      relations: ['user'],
      order: { createdAt: 'ASC' },
      take: 10 // Process max 10 at a time
    });
    
    if (pendingTransactions.length === 0) {
      console.log('✅ No pending BOG transactions to verify');
      return results;
    }
    
    console.log(`📋 Found ${pendingTransactions.length} pending BOG transactions`);
    
    const bogService = new BogPaymentService();
    
    // Process transactions in parallel (max 3 at a time)
    const batchSize = 3;
    for (let i = 0; i < pendingTransactions.length; i += batchSize) {
      const batch = pendingTransactions.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(transaction => 
          processTransaction(transaction, bogService).catch(error => ({
            transactionId: transaction.uuid,
            status: 'error' as const,
            message: error.message
          }))
        )
      );
      
      results.push(...batchResults);
      
      // Log results
      batchResults.forEach(result => {
        const icon = 
          result.status === 'completed' ? '✅' :
          result.status === 'failed' ? '❌' :
          result.status === 'pending' ? '⏳' : '⚠️';
        
        console.log(`${icon} Transaction ${result.transactionId}: ${result.message}`);
        
        if (result.status === 'completed' && result.balanceUpdate) {
          console.log(`  💰 Balance: ${result.balanceUpdate.oldBalance} → ${result.balanceUpdate.newBalance}`);
        }
      });
    }
    
    // Summary
    const completed = results.filter(r => r.status === 'completed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const pending = results.filter(r => r.status === 'pending').length;
    const errors = results.filter(r => r.status === 'error').length;
    
    console.log(`📊 Verification complete: ${completed} completed, ${failed} failed, ${pending} pending, ${errors} errors`);
    
    return results;
    
  } catch (error: unknown) {
    console.error('❌ Error in payment verification:', error);
    throw error;
  }
}

/**
 * Verify a specific transaction by ID
 */
export async function verifySinglePayment(transactionId: string): Promise<VerificationResult> {
  const transactionRepository = AppDataSource.getRepository(Transaction);
  
  const transaction = await transactionRepository.findOne({
    where: [
      { uuid: transactionId },
      { externalTransactionId: transactionId }
    ],
    relations: ['user']
  });
  
  if (!transaction) {
    return {
      transactionId,
      status: 'error',
      message: 'Transaction not found'
    };
  }
  
  if (transaction.status === TransactionStatusEnum.COMPLETED) {
    return {
      transactionId: transaction.uuid,
      status: 'completed',
      message: 'Transaction already completed'
    };
  }
  
  const bogService = new BogPaymentService();
  return processTransaction(transaction, bogService);
}

/**
 * Payment verification scheduler
 */
class PaymentVerificationScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private intervalMinutes = 5;
  
  /**
   * Start the verification scheduler
   */
  start(intervalMinutes = 5): void {
    if (this.intervalId) {
      console.log('⚠️ Payment verification scheduler already running');
      return;
    }
    
    this.intervalMinutes = intervalMinutes;
    
    // Run after initial delay
    setTimeout(() => {
      this.runVerification();
    }, 10000); // 10 seconds after startup
    
    // Then run periodically
    this.intervalId = setInterval(() => {
      this.runVerification();
    }, intervalMinutes * 60 * 1000);
    
    console.log(`💼 Payment verification scheduler started (runs every ${intervalMinutes} minutes)`);
  }
  
  /**
   * Stop the verification scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Payment verification scheduler stopped');
    }
  }
  
  /**
   * Run verification (prevents concurrent runs)
   */
  private async runVerification(): Promise<void> {
    if (this.isRunning) {
      console.log('⏳ Previous verification still running, skipping...');
      return;
    }
    
    this.isRunning = true;
    
    try {
      await verifyPendingBogPayments();
    } catch (error: unknown) {
      console.error('Error in scheduled verification:', error);
    } finally {
      this.isRunning = false;
    }
  }
  
  /**
   * Run verification immediately
   */
  async runNow(): Promise<VerificationResult[]> {
    console.log('🔄 Running manual payment verification...');
    return verifyPendingBogPayments();
  }
}

// Export singleton instance
export const paymentVerificationScheduler = new PaymentVerificationScheduler();

/**
 * Start the payment verification job
 */
export function startPaymentVerificationJob(intervalMinutes = 5): void {
  paymentVerificationScheduler.start(intervalMinutes);
}

/**
 * Stop the payment verification job
 */
export function stopPaymentVerificationJob(): void {
  paymentVerificationScheduler.stop();
}