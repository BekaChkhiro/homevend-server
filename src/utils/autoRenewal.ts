/**
 * Auto renewal service for properties
 * Updates property creation dates daily for properties with active auto-renewal
 */

import { AppDataSource } from '../config/database.js';
import { Property } from '../models/Property.js';
import { MoreThan, LessThan } from 'typeorm';

/**
 * Process auto renewals for all eligible properties
 * Should be called daily at midnight
 */
export async function processAutoRenewals(): Promise<void> {
  const propertyRepository = AppDataSource.getRepository(Property);
  
  try {
    const now = new Date();
    console.log(`🔄 Starting auto-renewal process at ${now.toISOString()}`);
    
    // Find properties with active auto-renewal that haven't expired
    const autoRenewProperties = await propertyRepository.find({
      where: {
        autoRenewEnabled: true,
        autoRenewExpiresAt: MoreThan(now)
      }
    });

    console.log(`📋 Found ${autoRenewProperties.length} properties with active auto-renewal`);
    
    let renewedCount = 0;
    
    for (const property of autoRenewProperties) {
      try {
        // Update the created_at date to current date to bring property to top
        const previousCreatedAt = property.createdAt;
        property.createdAt = new Date();
        
        await propertyRepository.save(property);
        
        console.log(`✅ Renewed property ${property.id}: ${previousCreatedAt.toISOString()} → ${property.createdAt.toISOString()}`);
        renewedCount++;
        
      } catch (error) {
        console.error(`❌ Failed to renew property ${property.id}:`, error);
      }
    }
    
    console.log(`🎯 Auto-renewal process completed. Renewed ${renewedCount}/${autoRenewProperties.length} properties`);
    
  } catch (error) {
    console.error('❌ Error during auto-renewal process:', error);
  }
}

/**
 * Check and disable expired auto-renewal services
 * Should be called along with processAutoRenewals
 */
export async function expireAutoRenewals(): Promise<void> {
  const propertyRepository = AppDataSource.getRepository(Property);
  
  try {
    const now = new Date();
    console.log(`⏰ Checking for expired auto-renewal services at ${now.toISOString()}`);
    
    // Find properties with expired auto-renewal service
    const expiredProperties = await propertyRepository.find({
      where: {
        autoRenewEnabled: true,
        autoRenewExpiresAt: LessThan(now)
      }
    });

    console.log(`📋 Found ${expiredProperties.length} expired auto-renewal services`);
    
    for (const property of expiredProperties) {
      try {
        property.autoRenewEnabled = false;
        await propertyRepository.save(property);
        
        console.log(`🔴 Disabled expired auto-renewal for property ${property.id} (expired at ${property.autoRenewExpiresAt?.toISOString()})`);
      } catch (error) {
        console.error(`❌ Failed to disable auto-renewal for property ${property.id}:`, error);
      }
    }
    
    console.log(`✅ Expired auto-renewal check completed. Disabled ${expiredProperties.length} services`);
    
  } catch (error) {
    console.error('❌ Error during auto-renewal expiration check:', error);
  }
}

/**
 * Get summary of auto-renewal statistics
 */
export async function getAutoRenewalStats(): Promise<{
  activeCount: number;
  expiredCount: number;
  totalCount: number;
}> {
  const propertyRepository = AppDataSource.getRepository(Property);
  
  try {
    const now = new Date();
    
    const activeCount = await propertyRepository.count({
      where: {
        autoRenewEnabled: true,
        autoRenewExpiresAt: MoreThan(now)
      }
    });
    
    const expiredCount = await propertyRepository.count({
      where: {
        autoRenewEnabled: true,
        autoRenewExpiresAt: LessThan(now)
      }
    });
    
    const totalCount = await propertyRepository.count({
      where: {
        autoRenewEnabled: true
      }
    });
    
    return { activeCount, expiredCount, totalCount };
    
  } catch (error) {
    console.error('Error getting auto-renewal stats:', error);
    return { activeCount: 0, expiredCount: 0, totalCount: 0 };
  }
}

/**
 * Manual trigger for auto-renewal processing (for testing)
 */
export async function triggerAutoRenewal(): Promise<{
  renewed: number;
  expired: number;
  stats: Awaited<ReturnType<typeof getAutoRenewalStats>>;
}> {
  console.log('🔧 Manual auto-renewal trigger initiated');
  
  await processAutoRenewals();
  await expireAutoRenewals();
  
  const stats = await getAutoRenewalStats();
  
  return {
    renewed: stats.activeCount,
    expired: stats.expiredCount,
    stats
  };
}