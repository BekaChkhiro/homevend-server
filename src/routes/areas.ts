import { Router } from 'express';
import {
  getAllAreas,
  getAreaById,
  getAreasByCity
} from '../controllers/areaController.js';

const router = Router();

// Public routes
router.get('/', getAllAreas);
router.get('/:id', getAreaById);
router.get('/city/:cityId', getAreasByCity);

export default router;