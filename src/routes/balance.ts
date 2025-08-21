import { Router } from 'express';
import {
  getUserBalance,
  processTopUp,
  getTransactionHistory
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

export default router;