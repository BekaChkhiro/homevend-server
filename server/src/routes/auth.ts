import { Router } from 'express';
import { register, login, getProfile, refreshToken, logout } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { registerSchema, loginSchema } from '../utils/validation.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Public routes (rate limiting removed for easier testing)
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refreshToken);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.post('/logout', authenticate, logout);

export default router;