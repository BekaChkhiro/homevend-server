import { Router } from 'express';
import authRoutes from './auth.js';
import propertyRoutes from './properties.js';
import adminRoutes from './admin.js';
import districtRoutes from './districts.js';
import priceStatisticRoutes from './priceStatistics.js';
import cityRoutes from './cities.js';
import lookupRoutes from './lookup.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/properties', propertyRoutes);
router.use('/admin', adminRoutes);
router.use('/districts', districtRoutes);
router.use('/price-statistics', priceStatisticRoutes);
router.use('/cities', cityRoutes);
router.use('/lookup', lookupRoutes);

export default router;