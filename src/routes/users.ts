import { Router } from 'express';
import { 
  getUserById,
  getUsers,
  updateUserProfile
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/', getUsers);
router.get('/:id', getUserById);

// Protected routes
router.put('/profile', authenticate, updateUserProfile);

export default router;