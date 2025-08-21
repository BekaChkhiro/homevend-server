import { Router } from 'express';
import {
  getUserBalance,
  processTopUp,
  getTransactionHistory,
  getDetailedTransactions,
  getTransactionSummary as getTransactionStats
} from '../controllers/balanceController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All balance routes require authentication
router.use(authenticate);

// Get user balance and recent transactions
router.get('/', getUserBalance);

// Process top-up
router.post('/top-up', processTopUp);

// Get transaction history with pagination
router.get('/transactions', getTransactionHistory);

// Get detailed transaction history with service information
router.get('/transactions/detailed', getDetailedTransactions);

// Get transaction summary statistics
router.get('/transactions/summary', getTransactionStats);

export default router;