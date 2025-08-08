import { Router } from 'express';
import authRoutes from './auth.js';
import propertyRoutes from './properties.js';
import adminRoutes from './admin.js';
import districtRoutes from './districts.js';
import priceStatisticRoutes from './priceStatistics.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/properties', propertyRoutes);
router.use('/admin', adminRoutes);
router.use('/districts', districtRoutes);
router.use('/price-statistics', priceStatisticRoutes);

export default router;