import { Router } from 'express';
import { 
  createProperty, 
  getProperties, 
  getPropertyById,
  getUserProperties,
  updateProperty, 
  deleteProperty,
  approveProperty
} from '../controllers/propertyController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { propertySchema } from '../utils/validation.js';

const router = Router();

router.get('/', getProperties);

router.use(authenticate);

router.get('/user/my-properties', getUserProperties);
router.get('/:id', getPropertyById);
router.post('/', validate(propertySchema), createProperty);
router.put('/:id', validate(propertySchema), updateProperty);
router.delete('/:id', deleteProperty);

router.patch('/:id/status', authorize('admin'), approveProperty);

export default router;