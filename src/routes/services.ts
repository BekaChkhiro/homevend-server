import { Router } from 'express';
import {
  getServicePricing,
  purchaseServices,
  getPropertyServices,
  getServiceTransactionHistory
} from '../controllers/serviceController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public route for service pricing (no auth required)
router.get('/pricing', getServicePricing);

// All other routes require authentication
router.use(authenticate);

// Purchase services for property
router.post('/purchase', purchaseServices);

// Get property active services
router.get('/property/:propertyId', getPropertyServices);

// Get user's service transaction history
router.get('/transactions', getServiceTransactionHistory);

export default router;