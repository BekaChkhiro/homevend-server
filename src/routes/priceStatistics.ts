import { Router } from 'express';
import {
  getAllPriceStatistics,
  getPriceStatisticById,
  getPriceStatisticsByDistrict,
  createPriceStatistic,
  updatePriceStatistic,
  deletePriceStatistic,
  getDistrictPriceOverview
} from '../controllers/priceStatisticController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/', getAllPriceStatistics);
router.get('/overview', getDistrictPriceOverview);
router.get('/:id', getPriceStatisticById);
router.get('/district/:districtId', getPriceStatisticsByDistrict);

// Admin-only routes for write operations
router.post('/', authenticate, authorize('admin'), createPriceStatistic);
router.put('/:id', authenticate, authorize('admin'), updatePriceStatistic);
router.delete('/:id', authenticate, authorize('admin'), deletePriceStatistic);

export default router;