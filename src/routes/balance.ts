import { Router, Request, Response } from 'express';
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
import { BogPaymentService } from '../services/payments/BogPaymentService.js';
import { verifySinglePayment, paymentVerificationScheduler } from '../utils/paymentVerification.js';

const router = Router();

// Webhook endpoints (no authentication required)
router.post('/flitt/callback', handleFlittCallback);
router.post('/bog/callback', handleBogCallback);

// Debug endpoint to check pending BOG transactions (no auth for testing)
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
        externalTransactionId: tx.externalTransactionId,
        amount: tx.amount,
        userId: tx.userId,
        userName: tx.user?.fullName,
        createdAt: tx.createdAt,
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

// Test endpoint to simulate BOG callback (no auth for testing)
router.post('/bog/test-callback', async (req: Request, res: Response) => {
  const { bogOrderId, externalOrderId, status = 'completed', amount } = req.body;
  
  if (!bogOrderId && !externalOrderId) {
    return res.status(400).json({
      error: 'Please provide either bogOrderId or externalOrderId'
    });
  }
  
  // Get transaction to find the actual amount if not provided
  let transferAmount = amount || '100.00';
  if (!amount) {
    try {
      const transactionRepository = AppDataSource.getRepository(Transaction);
      const transaction = await transactionRepository.findOne({
        where: [
          { externalTransactionId: externalOrderId },
          { externalTransactionId: bogOrderId }
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