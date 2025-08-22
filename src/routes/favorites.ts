import { Router } from 'express';
import { favoritesController } from '../controllers/favoritesController.js';
import { authenticate } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Apply authentication middleware to all favorites routes
router.use(authenticate);

// Apply specific rate limiting for favorites API
const favoritesRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 10, // Allow only 10 requests per minute per user
  message: 'Too many favorites requests. Please wait before trying again.',
  // Cast to any to access req.user installed by authenticate middleware
  keyGenerator: (req) => `favorites:${(req as any).user?.id || req.ip}`
});

router.use(favoritesRateLimiter);

// GET /api/favorites - Get user's favorite properties
router.get('/', favoritesController.getFavorites);

// POST /api/favorites - Add property to favorites
router.post('/', favoritesController.addToFavorites);

// DELETE /api/favorites/:propertyId - Remove property from favorites
router.delete('/:propertyId', favoritesController.removeFromFavorites);

// GET /api/favorites/check/:propertyId - Check if property is in favorites
router.get('/check/:propertyId', favoritesController.isFavorite);

export default router;
