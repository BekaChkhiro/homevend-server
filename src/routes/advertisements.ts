import express from 'express';
import {
  createAdvertisement,
  getAdvertisements,
  getAdvertisementById,
  getActiveAdvertisementByPlacement,
  updateAdvertisement,
  deleteAdvertisement,
  trackClick,
  trackView,
} from '../controllers/advertisementController.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/placement/:placementId', getActiveAdvertisementByPlacement);
router.post('/:id/click', trackClick);
router.post('/:id/view', trackView);

// Admin routes
router.post('/', authenticate, authorizeAdmin, createAdvertisement);
router.get('/', authenticate, authorizeAdmin, getAdvertisements);
router.get('/:id', authenticate, authorizeAdmin, getAdvertisementById);
router.put('/:id', authenticate, authorizeAdmin, updateAdvertisement);
router.delete('/:id', authenticate, authorizeAdmin, deleteAdvertisement);

export default router;
