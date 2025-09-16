import { Router } from 'express';
import { 
  getDevelopers, 
  getDeveloperById,
  createDeveloper,
  updateDeveloper,
  getMyDeveloper
} from '../controllers/DeveloperController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Protected routes (more specific routes first)
router.get('/my/profile', authenticate, getMyDeveloper);

// Public routes
router.get('/', getDevelopers);
router.get('/:id', getDeveloperById);

// Protected routes
router.post('/', authenticate, createDeveloper);
router.put('/:id', authenticate, updateDeveloper);

export default router;