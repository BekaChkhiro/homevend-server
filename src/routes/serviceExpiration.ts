/**
 * Service expiration API routes
 * Provides endpoints for managing and monitoring service expirations
 */

import express from 'express';
import { 
  expireServices, 
  getExpiredServiceStats,
  triggerServiceExpiration,
  hasActiveServices,
  getActiveServiceTypes,
  getServiceExpirationInfo
} from '../utils/serviceExpiration.js';
import { AppDataSource } from '../config/database.js';
import { Property } from '../models/Property.js';

const router = express.Router();

/**
 * GET /api/service-expiration/stats
 * Get expired service statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await getExpiredServiceStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting service expiration stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get service expiration statistics'
    });
  }
});

/**
 * POST /api/service-expiration/trigger
 * Manually trigger service expiration process (for testing)
 */
router.post('/trigger', async (req, res) => {
  try {
    console.log('🔧 Manual service expiration trigger requested via API');
    
    const result = await triggerServiceExpiration();
    
    res.json({
      success: true,
      message: 'Service expiration process completed',
      data: result
    });
  } catch (error) {
    console.error('Error triggering service expiration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger service expiration process'
    });
  }
});

/**
 * POST /api/service-expiration/process
 * Process service expirations
 */
router.post('/process', async (req, res) => {
  try {
    console.log('🕒 Processing service expirations via API');
    
    await expireServices();
    const stats = await getExpiredServiceStats();
    
    res.json({
      success: true,
      message: 'Service expiration processing completed',
      data: stats
    });
  } catch (error) {
    console.error('Error processing service expirations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process service expirations'
    });
  }
});

/**
 * GET /api/service-expiration/property/:propertyId
 * Get service expiration info for a specific property
 */
router.get('/property/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const propertyRepository = AppDataSource.getRepository(Property);
    
    const property = await propertyRepository.findOne({
      where: { id: parseInt(propertyId) }
    });

    if (!property) {
      res.status(404).json({
        success: false,
        error: 'Property not found'
      });
      return;
    }

    const expirationInfo = getServiceExpirationInfo(property);
    const activeServices = getActiveServiceTypes(property);
    const hasActive = hasActiveServices(property);

    res.json({
      success: true,
      data: {
        propertyId: property.id,
        hasActiveServices: hasActive,
        activeServices,
        expirationInfo
      }
    });
  } catch (error) {
    console.error('Error getting property service info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get property service information'
    });
  }
});

/**
 * GET /api/service-expiration/properties/expired
 * Get list of properties with expired services
 */
router.get('/properties/expired', async (req, res) => {
  try {
    const propertyRepository = AppDataSource.getRepository(Property);
    const now = new Date();

    // Get properties with any expired services
    const expiredVipProperties = await propertyRepository.find({
      where: {
        vipStatus: 'vip' as any, // Any status that's not NONE
        vipExpiresAt: new Date() // LessThan doesn't work well in this context
      },
      select: ['id', 'title', 'vipStatus', 'vipExpiresAt']
    });

    const expiredColorProperties = await propertyRepository.find({
      where: {
        colorSeparationEnabled: true,
        colorSeparationExpiresAt: new Date()
      },
      select: ['id', 'title', 'colorSeparationEnabled', 'colorSeparationExpiresAt']
    });

    // Filter by actual expiration
    const expiredVip = expiredVipProperties.filter(p => 
      p.vipExpiresAt && p.vipExpiresAt < now
    );
    
    const expiredColor = expiredColorProperties.filter(p => 
      p.colorSeparationExpiresAt && p.colorSeparationExpiresAt < now
    );

    res.json({
      success: true,
      data: {
        expiredVipProperties: expiredVip,
        expiredColorSeparationProperties: expiredColor,
        summary: {
          totalExpiredVip: expiredVip.length,
          totalExpiredColorSeparation: expiredColor.length,
          totalExpired: expiredVip.length + expiredColor.length
        }
      }
    });
  } catch (error) {
    console.error('Error getting expired properties:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get expired properties'
    });
  }
});

export default router;