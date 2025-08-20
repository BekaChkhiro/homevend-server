import { Router } from 'express';
import authRoutes from './auth.js';
import propertyRoutes from './properties.js';
import adminRoutes from './admin.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/properties', propertyRoutes);
router.use('/admin', adminRoutes);

export default router;