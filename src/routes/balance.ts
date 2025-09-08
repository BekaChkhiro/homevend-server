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
import { handleBogCallback } from '../controllers/bogWebhookController.js';
import { authenticate } from '../middleware/auth.js';
import { AppDataSource } from '../config/database.js';
import { Transaction, TransactionStatusEnum, TransactionTypeEnum } from '../models/Transaction.js';

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
  const { bogOrderId, externalOrderId, status = 'completed' } = req.body;
  
  if (!bogOrderId && !externalOrderId) {
    return res.status(400).json({
      error: 'Please provide either bogOrderId or externalOrderId'
    });
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
        transfer_amount: '100.00', // This should match the transaction amount
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