import { Router, Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.js';
import {
  getUserBalance,
  processTopUp,
  getTransactionHistory,
  getDetailedTransactions,
  getTransactionSummary as getTransactionStats,
  getPaymentProviders,
  initiateTopUp
} from '../controllers/balanceController.js';
import { handleFlittCallback } from '../controllers/flittWebhookController.js';
import { handleBogCallback, handleBogPaymentDetails } from '../controllers/bogWebhookController.js';
import { authenticate } from '../middleware/auth.js';
import { AppDataSource } from '../config/database.js';
import { Transaction, TransactionStatusEnum, TransactionTypeEnum } from '../models/Transaction.js';
import { User } from '../models/User.js';
import { BogPaymentService } from '../services/payments/BogPaymentService.js';
import { verifySinglePayment, paymentVerificationScheduler, verifyUserPendingPayments } from '../utils/paymentVerification.js';
import { LessThan } from 'typeorm';

const router = Router();

// Webhook endpoints (no authentication required)
router.post('/flitt/callback', handleFlittCallback);
router.post('/bog/callback', handleBogCallback);

// Debug endpoint to check pending BOG transactions (no auth for testing - temporarily)
router.get('/bog/debug/pending', async (req: Request, res: Response) => {
  try {
    const transactionRepository = AppDataSource.getRepository(Transaction);
    const pendingTransactions = await transactionRepository.find({
      where: {
        type: TransactionTypeEnum.TOP_UP,
        status: TransactionStatusEnum.PENDING,
        paymentMethod: 'bog'
      },
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });

    res.json({
      success: true,
      count: pendingTransactions.length,
      transactions: pendingTransactions.map(tx => ({
        uuid: tx.uuid,
        externalTransactionId: tx.externalTransactionId, // Now should contain BOG order ID
        amount: tx.amount,
        userId: tx.userId,
        userName: tx.user?.fullName,
        createdAt: tx.createdAt,
        originalOrderId: tx.metadata?.originalOrderId, // Our internal order ID
        bogOrderId: tx.metadata?.bogOrderId, // BOG's order ID (should match externalTransactionId)
        metadata: tx.metadata
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test immediate verification (no auth for testing)
router.post('/bog/test-verify-user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (!userId) {
      return res.status(400).json({
        error: 'Invalid user ID'
      });
    }
    
    console.log(`🧪 Testing immediate verification for user ${userId}`);
    
    const results = await verifyUserPendingPayments(userId);
    
    return res.json({
      success: true,
      message: `Tested verification for user ${userId}`,
      results: results
    });
    
  } catch (error: any) {
    console.error('Test verification error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoint to simulate BOG callback (no auth for testing)
router.post('/bog/test-callback', async (req: Request, res: Response) => {
  const { bogOrderId, externalOrderId, status = 'completed', amount } = req.body;
  
  if (!bogOrderId && !externalOrderId) {
    return res.status(400).json({
      error: 'Please provide either bogOrderId or externalOrderId',
      hint: 'For new transactions, use bogOrderId (BOG\'s order ID) for direct matching'
    });
  }
  
  // Get transaction to find the actual amount if not provided
  let transferAmount = amount || '100.00';
  if (!amount) {
    try {
      const transactionRepository = AppDataSource.getRepository(Transaction);
      const transaction = await transactionRepository.findOne({
        where: [
          { externalTransactionId: bogOrderId },
          { externalTransactionId: externalOrderId }
        ]
      });
      if (transaction) {
        transferAmount = transaction.amount.toString();
      }
    } catch (error) {
      console.error('Error fetching transaction for test:', error);
    }
  }
  
  // Simulate BOG callback format
  const testCallback = {
    body: {
      order_id: bogOrderId,
      external_order_id: externalOrderId,
      order_status: {
        key: status,
        value: status === 'completed' ? 'გადახდა წარმატებულია' : 'გადახდა ვერ განხორციელდა'
      },
      purchase_units: {
        transfer_amount: transferAmount,
        currency_code: 'GEL'
      },
      payment_detail: {
        transaction_id: `test_${Date.now()}`,
        transfer_method: {
          key: 'card',
          value: 'ბარათი'
        }
      }
    }
  };
  
  // Forward to actual BOG callback handler
  req.body = testCallback;
  return handleBogCallback(req, res);
});

// Admin endpoint to cleanup old invalid transactions (no auth for testing)
router.post('/bog/cleanup', async (req: Request, res: Response) => {
  try {
    const transactionRepository = AppDataSource.getRepository(Transaction);
    
    // Find old pending BOG transactions (more than 1 hour old for testing)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const oldTransactions = await transactionRepository.find({
      where: {
        type: TransactionTypeEnum.TOP_UP,
        status: TransactionStatusEnum.PENDING,
        paymentMethod: 'bog',
        createdAt: LessThan(oneHourAgo)
      }
    });
    
    if (oldTransactions.length === 0) {
      return res.json({
        success: true,
        message: 'No old pending transactions to cleanup',
        cleaned: 0
      });
    }
    
    let cleaned = 0;
    for (const transaction of oldTransactions) {
      const bogOrderId = transaction.metadata?.bogOrderId || 
        (!transaction.externalTransactionId?.startsWith('topup_') ? transaction.externalTransactionId : null);
      
      if (!bogOrderId || bogOrderId.startsWith('topup_')) {
        transaction.status = TransactionStatusEnum.FAILED;
        transaction.metadata = {
          ...transaction.metadata,
          cleanupReason: 'No valid BOG order ID found',
          cleanedUpAt: new Date().toISOString()
        };
        await transactionRepository.save(transaction);
        cleaned++;
      }
    }
    
    return res.json({
      success: true,
      message: `Cleaned up ${cleaned} invalid transactions`,
      total: oldTransactions.length,
      cleaned
    });
    
  } catch (error: any) {
    console.error('Cleanup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cleanup transactions',
      error: error.message
    });
  }
});

// Manual payment verification endpoint (requires authentication)
router.post('/bog/verify/:transactionId', authenticate, async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    
    // Use the refactored verification utility
    const result = await verifySinglePayment(transactionId);
    
    if (result.status === 'error') {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    if (result.status === 'completed') {
      // Get updated transaction for response
      const transactionRepository = AppDataSource.getRepository(Transaction);
      const transaction = await transactionRepository.findOne({
        where: [
          { uuid: transactionId },
          { externalTransactionId: transactionId }
        ]
      });
      
      return res.json({
        success: true,
        message: result.message,
        data: {
          status: result.status,
          amount: transaction?.amount,
          balanceAfter: transaction?.balanceAfter,
          balanceUpdate: result.balanceUpdate
        }
      });
    }
    
    return res.json({
      success: result.status === 'pending',
      message: result.message,
      data: {
        status: result.status
      }
    });
    
  } catch (error: any) {
    console.error('Manual verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
});

// Admin endpoint to manually run verification for all pending payments
router.post('/bog/verify-all', authenticate, async (req: Request, res: Response) => {
  try {
    const results = await paymentVerificationScheduler.runNow();
    
    const summary = {
      total: results.length,
      completed: results.filter(r => r.status === 'completed').length,
      failed: results.filter(r => r.status === 'failed').length,
      pending: results.filter(r => r.status === 'pending').length,
      errors: results.filter(r => r.status === 'error').length
    };
    
    return res.json({
      success: true,
      message: 'Verification completed',
      summary,
      results
    });
    
  } catch (error: any) {
    console.error('Bulk verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to run bulk verification',
      error: error.message
    });
  }
});

// All other balance routes require authentication
router.use(authenticate);

// Immediate payment verification for current user
router.post('/verify-payments', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    
    console.log(`🔄 Immediate verification requested for user ${userId}`);
    
    // Verify all pending payments for this user
    const results = await verifyUserPendingPayments(userId);
    
    // Check if any payments were completed
    const completed = results.filter(r => r.status === 'completed');
    const failed = results.filter(r => r.status === 'failed');
    const pending = results.filter(r => r.status === 'pending');
    const errors = results.filter(r => r.status === 'error');
    
    // Get updated user balance
    const userRepository = AppDataSource.getRepository(User);
    const updatedUser = await userRepository.findOne({
      where: { id: userId },
      select: ['id', 'balance']
    });
    
    const response = {
      success: true,
      message: `Verified ${results.length} pending transactions`,
      currentBalance: updatedUser?.balance ? parseFloat(updatedUser.balance.toString()) : 0,
      verification: {
        total: results.length,
        completed: completed.length,
        failed: failed.length,
        pending: pending.length,
        errors: errors.length
      },
      results: results.map(r => ({
        transactionId: r.transactionId,
        status: r.status,
        message: r.message,
        balanceUpdate: r.balanceUpdate
      })),
      // Indicate if user should refresh their balance
      balanceUpdated: completed.length > 0
    };
    
    if (completed.length > 0) {
      console.log(`✅ User ${userId}: ${completed.length} payments completed, balance updated`);
    }
    
    res.json(response);
    
  } catch (error: any) {
    console.error('Immediate verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payments',
      error: error.message
    });
  }
});

// Check payment status for a specific transaction (for polling)
router.get('/payment-status/:transactionId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { transactionId } = req.params;
    
    const transactionRepository = AppDataSource.getRepository(Transaction);
    
    // Find the transaction for this user
    const transaction = await transactionRepository.findOne({
      where: [
        { uuid: transactionId, userId: userId },
        { externalTransactionId: transactionId, userId: userId }
      ],
      select: ['uuid', 'status', 'amount', 'balanceAfter', 'createdAt', 'metadata']
    });
    
    if (!transaction) {
      res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
      return;
    }
    
    // If still pending, trigger immediate verification for this user
    let verificationTriggered = false;
    if (transaction.status === TransactionStatusEnum.PENDING) {
      verificationTriggered = true;
      console.log(`🔄 Payment status check: triggering verification for pending transaction ${transactionId}`);
      
      // Trigger async verification without waiting (but log the results)
      verifyUserPendingPayments(userId).then(results => {
        const completed = results.filter(r => r.status === 'completed').length;
        if (completed > 0) {
          console.log(`✅ Background verification completed ${completed} payments for user ${userId} during status check`);
        }
      }).catch(error => {
        console.error(`Background verification error for user ${userId}:`, error);
      });
    }
    
    // Get current user balance
    const userRepository = AppDataSource.getRepository(User);
    const currentUser = await userRepository.findOne({
      where: { id: userId },
      select: ['id', 'balance']
    });
    
    res.json({
      success: true,
      transaction: {
        id: transaction.uuid,
        status: transaction.status,
        amount: parseFloat(transaction.amount.toString()),
        balanceAfter: transaction.balanceAfter ? parseFloat(transaction.balanceAfter.toString()) : null,
        createdAt: transaction.createdAt.toISOString(),
        isPending: transaction.status === TransactionStatusEnum.PENDING,
        isCompleted: transaction.status === TransactionStatusEnum.COMPLETED,
        isFailed: transaction.status === TransactionStatusEnum.FAILED
      },
      currentBalance: currentUser ? parseFloat(currentUser.balance.toString()) : 0,
      verificationTriggered: verificationTriggered
    });
    
  } catch (error: any) {
    console.error('Payment status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check payment status',
      error: error.message
    });
  }
});

// Get user balance and recent transactions
router.get('/', getUserBalance);

// Get available payment providers
router.get('/providers', getPaymentProviders);

// Initiate top-up process (creates payment order)
router.post('/initiate', initiateTopUp);

// Legacy top-up endpoint (for backward compatibility)
router.post('/top-up', processTopUp);

// Get transaction history with pagination
router.get('/transactions', getTransactionHistory);

// Get detailed transaction history with service information
router.get('/transactions/detailed', getDetailedTransactions);

// Get transaction summary statistics
router.get('/transactions/summary', getTransactionStats);

export default router;