import { Router } from 'express';
import { favoritesController } from '../controllers/favoritesController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Apply authentication middleware to all favorites routes
router.use(authenticate);

// GET /api/favorites - Get user's favorite properties
router.get('/', favoritesController.getFavorites);

// POST /api/favorites - Add property to favorites
router.post('/', favoritesController.addToFavorites);

// DELETE /api/favorites/:propertyId - Remove property from favorites
router.delete('/:propertyId', favoritesController.removeFromFavorites);

// GET /api/favorites/check/:propertyId - Check if property is in favorites
router.get('/check/:propertyId', favoritesController.isFavorite);

export default router;