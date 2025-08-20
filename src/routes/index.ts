import { Router } from 'express';
import authRoutes from './auth.js';
import propertyRoutes from './properties.js';
import adminRoutes from './admin.js';
import districtRoutes from './districts.js';
import areaRoutes from './areas.js';
import priceStatisticRoutes from './priceStatistics.js';
import cityRoutes from './cities.js';
import lookupRoutes from './lookup.js';
import agencyRoutes from './agencies.js';
import userRoutes from './users.js';
import projectRoutes from './projects.js';
import favoritesRoutes from './favorites.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/properties', propertyRoutes);
router.use('/admin', adminRoutes);
router.use('/districts', districtRoutes);
router.use('/areas', areaRoutes);
router.use('/price-statistics', priceStatisticRoutes);
router.use('/cities', cityRoutes);
router.use('/lookup', lookupRoutes);
router.use('/agencies', agencyRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/favorites', favoritesRoutes);

export default router;