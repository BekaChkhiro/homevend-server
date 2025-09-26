import { Router } from 'express';
import {
  getActiveTermsConditions,
  getAllTermsConditions,
  getTermsConditionsForAdmin,
  createTermsConditions,
  updateTermsConditions,
  deleteTermsConditions
} from '../controllers/termsConditionsController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/', getActiveTermsConditions);

// Admin routes (these were already added to admin.ts, but let's keep them here too as backup)
router.get('/admin', authenticate, authorize('admin'), getTermsConditionsForAdmin);
router.get('/admin/all', authenticate, authorize('admin'), getAllTermsConditions);
router.post('/admin', authenticate, authorize('admin'), createTermsConditions);
router.put('/admin/:id', authenticate, authorize('admin'), updateTermsConditions);
router.delete('/admin/:id', authenticate, authorize('admin'), deleteTermsConditions);

export default router;