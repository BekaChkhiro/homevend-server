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

const router = Router();

// Public routes with rate limiting
// router.post('/register', authRateLimiter, validate(registerSchema), register); // Temporarily disabled rate limiting for testing
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login); // Temporarily disabled rate limiting for testing
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