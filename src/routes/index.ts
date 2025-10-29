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
import developerRoutes from './developers.js';
import userRoutes from './users.js';
import projectRoutes from './projects.js';
import favoritesRoutes from './favorites.js';
import balanceRoutes from './balance.js';
import vipRoutes from './vip.js';
import serviceRoutes from './services.js';
import autoRenewalRoutes from './autoRenewal.js';
import serviceExpirationRoutes from './serviceExpiration.js';
import uploadRoutes from './upload.js';
import termsConditionsRoutes from './termsConditionsRoutes.js';
import advertisementRoutes from './advertisements.js';
// import exchangeRateRoutes from './exchangeRates.js'; // TODO: Debug route handler issue

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
router.use('/developers', developerRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/favorites', favoritesRoutes);
router.use('/balance', balanceRoutes);
router.use('/vip', vipRoutes);
router.use('/services', serviceRoutes);
router.use('/auto-renewal', autoRenewalRoutes);
router.use('/service-expiration', serviceExpirationRoutes);
router.use('/upload', uploadRoutes);
router.use('/terms-conditions', termsConditionsRoutes);
router.use('/advertisements', advertisementRoutes);
// router.use('/exchange-rates', exchangeRateRoutes); // TODO: Debug route handler issue

export default router;