import { Router } from 'express';
import {
  getVipPricing,
  purchaseVipService,
  getPropertyVipStatus,
} from '../controllers/vipServiceController.js';
import {
  updateVipPricing
} from '../controllers/vipController.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

const router = Router();

// All VIP routes require authentication
router.use(authenticate);

// Get VIP pricing options (including new services)
router.get('/pricing', getVipPricing);

// Purchase VIP services for property (supports multiple services)
router.post('/purchase', purchaseVipService);

// Get property VIP status and active services
router.get('/property/:propertyId', getPropertyVipStatus);

// Admin routes
router.put('/pricing/:vipType', authorizeAdmin, updateVipPricing);

export default router;