/**
 * Auto renewal API routes
 * Provides endpoints for managing and monitoring auto-renewal services
 */

import express from 'express';
import { 
  triggerAutoRenewal, 
  getAutoRenewalStats,
  processAutoRenewals,
  expireAutoRenewals 
} from '../utils/autoRenewal.js';
import { getSchedulerStatus } from '../utils/scheduler.js';

const router = express.Router();

/**
 * GET /api/auto-renewal/stats
 * Get auto-renewal statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await getAutoRenewalStats();
    const schedulerStatus = getSchedulerStatus();
    
    res.json({
      success: true,
      data: {
        ...stats,
        schedulerStatus
      }
    });
  } catch (error) {
    console.error('Error getting auto-renewal stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get auto-renewal statistics'
    });
  }
});

/**
 * POST /api/auto-renewal/trigger
 * Manually trigger auto-renewal process (for testing)
 */
router.post('/trigger', async (req, res) => {
  try {
    console.log('🔧 Manual auto-renewal trigger requested via API');
    
    const result = await triggerAutoRenewal();
    
    res.json({
      success: true,
      message: 'Auto-renewal process completed',
      data: result
    });
  } catch (error) {
    console.error('Error triggering auto-renewal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger auto-renewal process'
    });
  }
});

/**
 * POST /api/auto-renewal/process
 * Process only renewals (don't handle expirations)
 */
router.post('/process', async (req, res) => {
  try {
    console.log('🔄 Processing auto-renewals via API');
    
    await processAutoRenewals();
    const stats = await getAutoRenewalStats();
    
    res.json({
      success: true,
      message: 'Auto-renewal processing completed',
      data: stats
    });
  } catch (error) {
    console.error('Error processing auto-renewals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process auto-renewals'
    });
  }
});

/**
 * POST /api/auto-renewal/expire
 * Process only expirations (don't handle renewals)
 */
router.post('/expire', async (req, res) => {
  try {
    console.log('⏰ Processing auto-renewal expirations via API');
    
    await expireAutoRenewals();
    const stats = await getAutoRenewalStats();
    
    res.json({
      success: true,
      message: 'Auto-renewal expiration processing completed',
      data: stats
    });
  } catch (error) {
    console.error('Error processing auto-renewal expirations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process auto-renewal expirations'
    });
  }
});

export default router;