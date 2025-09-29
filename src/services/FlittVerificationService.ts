import { AppDataSource } from '../config/database.js';
import { Transaction, TransactionStatusEnum } from '../models/Transaction.js';
import { User } from '../models/User.js';
import { FlittPaymentService } from './payments/FlittPaymentService.js';
import { LessThan, MoreThan } from 'typeorm';

export interface FlittVerificationResult {
  transactionId: string;
  orderId: string;
  status: 'completed' | 'failed' | 'pending' | 'error';
  message: string;
  balanceUpdate?: {
    userId: number;
    added: number;
    newBalance: number;
  };
}

export class FlittVerificationService {
  private flittService: FlittPaymentService;

  constructor() {
    this.flittService = new FlittPaymentService();
  }

  /**
   * Verify a single Flitt transaction
   */
  async verifySingleTransaction(transactionId: string): Promise<FlittVerificationResult> {
    const transactionRepository = AppDataSource.getRepository(Transaction);
    const userRepository = AppDataSource.getRepository(User);

    try {
      // Find the transaction
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
          orderId: transactionId,
          status: 'error',
          message: 'Transaction not found'
        };
      }

      if (transaction.status !== TransactionStatusEnum.PENDING) {
        return {
          transactionId: transaction.uuid,
          orderId: transaction.externalTransactionId || '',
          status: transaction.status === TransactionStatusEnum.COMPLETED ? 'completed' : 'failed',
          message: `Transaction already ${transaction.status.toLowerCase()}`
        };
      }

      const orderId = transaction.externalTransactionId;
      if (!orderId) {
        return {
          transactionId: transaction.uuid,
          orderId: '',
          status: 'error',
          message: 'No order ID found for transaction'
        };
      }

      console.log(`🔍 Verifying Flitt transaction ${transaction.uuid} with order ID ${orderId}`);

      // Check order status with Flitt API
      const flittStatus = await this.flittService.getOrderStatus(orderId);

      // Check if payment is completed
      if (this.flittService.isOrderCompleted(flittStatus)) {
        return await this.completeTransaction(transaction, flittStatus);
      }

      // Check if payment failed
      if (this.flittService.isOrderFailed(flittStatus)) {
        return await this.failTransaction(transaction, flittStatus);
      }

      // Still pending
      return {
        transactionId: transaction.uuid,
        orderId,
        status: 'pending',
        message: `Payment still pending with status: ${flittStatus.order_status}`
      };

    } catch (error: any) {
      console.error(`❌ Error verifying Flitt transaction ${transactionId}:`, error.message);
      return {
        transactionId,
        orderId: '',
        status: 'error',
        message: `Verification failed: ${error.message}`
      };
    }
  }

  /**
   * Complete a transaction and update user balance
   */
  private async completeTransaction(transaction: Transaction, flittStatus: any): Promise<FlittVerificationResult> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transactionRepo = queryRunner.manager.getRepository(Transaction);
      const userRepo = queryRunner.manager.getRepository(User);

      // Get user
      const user = await userRepo.findOne({
        where: { id: transaction.userId },
        select: ['id', 'balance']
      });

      if (!user) {
        await queryRunner.rollbackTransaction();
        return {
          transactionId: transaction.uuid,
          orderId: transaction.externalTransactionId || '',
          status: 'error',
          message: 'User not found'
        };
      }

      const currentBalance = parseFloat(user.balance.toString());

      // Handle amount from Flitt API response
      // API status responses return amounts in tetri (same format as sent), need to convert to GEL
      let actualAmount = 0;

      if (flittStatus.actual_amount) {
        // Convert from tetri to GEL
        actualAmount = parseFloat(flittStatus.actual_amount) / 100;
        console.log(`💰 Using actual_amount: ${flittStatus.actual_amount} tetri = ${actualAmount} GEL`);
      } else if (flittStatus.amount) {
        // Convert from tetri to GEL
        actualAmount = parseFloat(flittStatus.amount) / 100;
        console.log(`💰 Using amount: ${flittStatus.amount} tetri = ${actualAmount} GEL`);
      } else {
        // Fallback to transaction amount (already in GEL)
        actualAmount = parseFloat(transaction.amount.toString());
        console.log(`💰 Using transaction amount: ${actualAmount} GEL (fallback)`);
      }

      const newBalance = currentBalance + actualAmount;

      console.log(`💰 Completing Flitt payment for user ${user.id}:`);
      console.log(`  - Transaction: ${transaction.uuid}`);
      console.log(`  - Order ID: ${transaction.externalTransactionId}`);
      console.log(`  - Amount: ${actualAmount} GEL`);
      console.log(`  - Current balance: ${currentBalance} GEL`);
      console.log(`  - New balance: ${newBalance} GEL`);

      // Update transaction
      transaction.status = TransactionStatusEnum.COMPLETED;
      transaction.balanceAfter = newBalance;
      transaction.metadata = {
        ...transaction.metadata,
        completedAt: new Date().toISOString(),
        flittPaymentStatus: 'approved',
        flittVerificationResponse: flittStatus,
        verifiedAt: new Date().toISOString(),
        verificationMethod: 'automatic_api_check'
      };

      await transactionRepo.save(transaction);

      // Update user balance
      user.balance = newBalance;
      await userRepo.save(user);

      await queryRunner.commitTransaction();

      console.log(`✅ Flitt payment completed automatically for transaction ${transaction.uuid}`);

      return {
        transactionId: transaction.uuid,
        orderId: transaction.externalTransactionId || '',
        status: 'completed',
        message: `Payment completed successfully. Balance updated from ${currentBalance} to ${newBalance} GEL`,
        balanceUpdate: {
          userId: user.id,
          added: actualAmount,
          newBalance
        }
      };

    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Mark transaction as failed
   */
  private async failTransaction(transaction: Transaction, flittStatus: any): Promise<FlittVerificationResult> {
    const transactionRepository = AppDataSource.getRepository(Transaction);

    transaction.status = TransactionStatusEnum.FAILED;
    transaction.metadata = {
      ...transaction.metadata,
      failedAt: new Date().toISOString(),
      flittPaymentStatus: flittStatus.order_status,
      flittVerificationResponse: flittStatus,
      verifiedAt: new Date().toISOString(),
      verificationMethod: 'automatic_api_check',
      failureReason: flittStatus.response_description || `Order status: ${flittStatus.order_status}`
    };

    await transactionRepository.save(transaction);

    console.log(`❌ Flitt payment failed for transaction ${transaction.uuid}: ${flittStatus.order_status}`);

    return {
      transactionId: transaction.uuid,
      orderId: transaction.externalTransactionId || '',
      status: 'failed',
      message: `Payment failed with status: ${flittStatus.order_status}`
    };
  }

  /**
   * Verify all pending Flitt transactions
   */
  async verifyAllPendingTransactions(): Promise<FlittVerificationResult[]> {
    const transactionRepository = AppDataSource.getRepository(Transaction);

    // Get all pending Flitt transactions from the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const pendingTransactions = await transactionRepository.find({
      where: {
        paymentMethod: 'flitt',
        status: TransactionStatusEnum.PENDING,
        createdAt: MoreThan(oneDayAgo)
      },
      order: { createdAt: 'ASC' }
    });

    console.log(`🔄 Found ${pendingTransactions.length} pending Flitt transactions to verify`);

    const results: FlittVerificationResult[] = [];

    for (const transaction of pendingTransactions) {
      try {
        const result = await this.verifySingleTransaction(transaction.uuid);
        results.push(result);

        // Add a small delay between API calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        console.error(`Error verifying transaction ${transaction.uuid}:`, error.message);
        results.push({
          transactionId: transaction.uuid,
          orderId: transaction.externalTransactionId || '',
          status: 'error',
          message: `Verification error: ${error.message}`
        });
      }
    }

    const summary = {
      total: results.length,
      completed: results.filter(r => r.status === 'completed').length,
      failed: results.filter(r => r.status === 'failed').length,
      pending: results.filter(r => r.status === 'pending').length,
      errors: results.filter(r => r.status === 'error').length
    };

    console.log(`📊 Flitt verification summary:`, summary);

    return results;
  }

  /**
   * Verify recent pending transactions for a specific user
   */
  async verifyUserPendingTransactions(userId: number): Promise<FlittVerificationResult[]> {
    const transactionRepository = AppDataSource.getRepository(Transaction);

    // Get pending Flitt transactions for this user from the last 10 minutes (more recent for immediate checking)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const userPendingTransactions = await transactionRepository.find({
      where: {
        userId,
        paymentMethod: 'flitt',
        status: TransactionStatusEnum.PENDING,
        createdAt: MoreThan(tenMinutesAgo)
      },
      order: { createdAt: 'DESC' }
    });

    console.log(`🔄 Found ${userPendingTransactions.length} pending Flitt transactions for user ${userId}`);

    const results: FlittVerificationResult[] = [];

    for (const transaction of userPendingTransactions) {
      try {
        const result = await this.verifySingleTransaction(transaction.uuid);
        results.push(result);

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error: any) {
        console.error(`Error verifying user transaction ${transaction.uuid}:`, error.message);
        results.push({
          transactionId: transaction.uuid,
          orderId: transaction.externalTransactionId || '',
          status: 'error',
          message: `Verification error: ${error.message}`
        });
      }
    }

    return results;
  }
}

export default FlittVerificationService;