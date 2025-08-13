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
// Temporarily disabled authentication for testing
router.post('/', createDistrict);
router.put('/:id', updateDistrict);
router.delete('/:id', deleteDistrict);

export default router;