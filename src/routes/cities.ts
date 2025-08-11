import { Router } from 'express';
import { 
  getAllCities, 
  getCityById, 
  createCity, 
  updateCity, 
  deleteCity,
  searchCities 
} from '../controllers/cityController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { UserRoleEnum } from '../models/User.js';

const router = Router();

// Public routes
router.get('/', getAllCities);
router.get('/search', searchCities);
router.get('/:id', getCityById);

// Admin routes
router.post('/', authenticate, authorize(UserRoleEnum.ADMIN), createCity);
router.put('/:id', authenticate, authorize(UserRoleEnum.ADMIN), updateCity);
router.delete('/:id', authenticate, authorize(UserRoleEnum.ADMIN), deleteCity);

export default router;