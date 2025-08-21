import { Router } from 'express';
import {
  getVipPricing,
  purchaseVipStatus,
  getPropertyVipStatus,
  updateVipPricing
} from '../controllers/vipController.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

const router = Router();

// All VIP routes require authentication
router.use(authenticate);

// Get VIP pricing options
router.get('/pricing', getVipPricing);

// Purchase VIP status for property
router.post('/purchase', purchaseVipStatus);

// Get property VIP status
router.get('/property/:propertyId', getPropertyVipStatus);

// Admin routes
router.put('/pricing/:vipType', authorizeAdmin, updateVipPricing);

export default router;