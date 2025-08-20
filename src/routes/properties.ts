import { Router } from 'express';
import { 
  createProperty, 
  getProperties, 
  getPropertyById,
  getUserProperties,
  updateProperty, 
  deleteProperty
} from '../controllers/propertyController.js';
import { getPropertiesByUserId } from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { propertySchema } from '../utils/validation.js';

const router = Router();

// Public routes (no authentication required)
router.get('/', getProperties);
router.get('/user/:userId', getPropertiesByUserId);

// Specific authenticated routes (must come before /:id)
router.get('/my-properties', authenticate, getUserProperties);

// Public route for property by ID (must come after specific routes)
router.get('/:id', getPropertyById);

// Apply authentication middleware for remaining routes
router.use(authenticate);
router.post('/', validate(propertySchema), createProperty);
router.put('/:id', validate(propertySchema), updateProperty);
router.patch('/:id', updateProperty); // Allow PATCH without full validation for partial updates
router.delete('/:id', deleteProperty);


export default router;