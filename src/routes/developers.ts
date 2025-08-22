import { Router } from 'express';
import { 
  getDevelopers, 
  getDeveloperById,
  createDeveloper,
  updateDeveloper,
  getMyDeveloper
} from '../controllers/developerController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/', getDevelopers);
router.get('/:id', getDeveloperById);

// Protected routes
router.post('/', authenticate, createDeveloper);
router.put('/:id', authenticate, updateDeveloper);
router.get('/my/profile', authenticate, getMyDeveloper);

export default router;