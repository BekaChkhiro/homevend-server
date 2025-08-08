import { Router } from 'express';
import {
  getAllDistricts,
  getDistrictById,
  createDistrict,
  updateDistrict,
  deleteDistrict
} from '../controllers/districtController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/', getAllDistricts);
router.get('/:id', getDistrictById);

// Admin-only routes for write operations
router.post('/', authenticate, authorize('admin'), createDistrict);
router.put('/:id', authenticate, authorize('admin'), updateDistrict);
router.delete('/:id', authenticate, authorize('admin'), deleteDistrict);

export default router;