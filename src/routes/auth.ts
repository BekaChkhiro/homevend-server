import { Router } from 'express';
import { 
  register, 
  login, 
  getProfile, 
  refreshToken, 
  logout,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  validateResetToken
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../utils/validation.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Public routes (rate limiting removed for easier testing)
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refreshToken);

// Email verification routes
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerification);

// Password reset routes
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password/:token', validate(resetPasswordSchema), resetPassword);
router.get('/validate-reset-token/:token', validateResetToken);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.post('/logout', authenticate, logout);

export default router;