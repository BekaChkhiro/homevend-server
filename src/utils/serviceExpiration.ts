/**
 * Utility functions for handling service expiration and cleanup
 */

import { AppDataSource } from '../config/database.js';
import { Property, VipStatusEnum } from '../models/Property.js';
import { MoreThan, LessThan } from 'typeorm';

/**
 * Check and disable expired services for properties
 * Note: Auto-renew expiration is now handled in autoRenewal.ts
 */
export async function expireServices(): Promise<void> {
  const propertyRepository = AppDataSource.getRepository(Property);
  
  try {
    const now = new Date();
    console.log(`🕒 Starting service expiration check at ${now.toISOString()}`);
    
    // Find properties with expired VIP status
    const expiredVipProperties = await propertyRepository.find({
      where: {
        vipStatus: MoreThan(VipStatusEnum.NONE), // Any VIP status other than NONE
        vipExpiresAt: LessThan(now)
      }
    });

    let expiredVipCount = 0;
    for (const property of expiredVipProperties) {
      const previousStatus = property.vipStatus;
      property.vipStatus = VipStatusEnum.NONE;
      await propertyRepository.save(property);
      console.log(`🔴 Expired VIP status for property ${property.id}: ${previousStatus} → ${VipStatusEnum.NONE} (expired at ${property.vipExpiresAt?.toISOString()})`);
      expiredVipCount++;
    }
    
    // Find properties with expired color separation service
    const expiredColorSeparationProperties = await propertyRepository.find({
      where: {
        colorSeparationEnabled: true,
        colorSeparationExpiresAt: LessThan(now)
      }
    });
    
    let expiredColorSeparationCount = 0;
    for (const property of expiredColorSeparationProperties) {
      property.colorSeparationEnabled = false;
      await propertyRepository.save(property);
      console.log(`🎨 Disabled expired color separation for property ${property.id} (expired at ${property.colorSeparationExpiresAt?.toISOString()})`);
      expiredColorSeparationCount++;
    }
    
    console.log(`✅ Service expiration check completed:`);
    console.log(`   - VIP statuses expired: ${expiredVipCount}`);
    console.log(`   - Color separation services disabled: ${expiredColorSeparationCount}`);
    
  } catch (error) {
    console.error('❌ Error during service expiration check:', error);
  }
}

/**
 * Check if a property has active services
 */
export function hasActiveServices(property: Property): boolean {
  const now = new Date();
  
  const hasActiveAutoRenew = property.autoRenewEnabled && 
    property.autoRenewExpiresAt && 
    property.autoRenewExpiresAt > now;
    
  const hasActiveColorSeparation = property.colorSeparationEnabled && 
    property.colorSeparationExpiresAt && 
    property.colorSeparationExpiresAt > now;

  const hasActiveVip = property.vipStatus !== VipStatusEnum.NONE && 
    property.vipExpiresAt && 
    property.vipExpiresAt > now;
    
  return hasActiveAutoRenew || hasActiveColorSeparation || hasActiveVip;
}

/**
 * Get active service types for a property
 */
export function getActiveServiceTypes(property: Property): string[] {
  const now = new Date();
  const activeServices: string[] = [];
  
  if (property.autoRenewEnabled && 
      property.autoRenewExpiresAt && 
      property.autoRenewExpiresAt > now) {
    activeServices.push('auto_renew');
  }
  
  if (property.colorSeparationEnabled && 
      property.colorSeparationExpiresAt && 
      property.colorSeparationExpiresAt > now) {
    activeServices.push('color_separation');
  }

  if (property.vipStatus !== VipStatusEnum.NONE && 
      property.vipExpiresAt && 
      property.vipExpiresAt > now) {
    activeServices.push(`vip_${property.vipStatus}`);
  }
  
  return activeServices;
}

/**
 * Get service expiration info for a property
 */
export function getServiceExpirationInfo(property: Property) {
  const now = new Date();
  
  const autoRenewInfo = property.autoRenewEnabled && property.autoRenewExpiresAt ? {
    isActive: property.autoRenewExpiresAt > now,
    expiresAt: property.autoRenewExpiresAt,
    daysRemaining: property.autoRenewExpiresAt > now ? 
      Math.ceil((property.autoRenewExpiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)) : 0
  } : null;
  
  const colorSeparationInfo = property.colorSeparationEnabled && property.colorSeparationExpiresAt ? {
    isActive: property.colorSeparationExpiresAt > now,
    expiresAt: property.colorSeparationExpiresAt,
    daysRemaining: property.colorSeparationExpiresAt > now ? 
      Math.ceil((property.colorSeparationExpiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)) : 0
  } : null;

  const vipInfo = property.vipStatus !== VipStatusEnum.NONE && property.vipExpiresAt ? {
    isActive: property.vipExpiresAt > now,
    expiresAt: property.vipExpiresAt,
    currentStatus: property.vipStatus,
    daysRemaining: property.vipExpiresAt > now ? 
      Math.ceil((property.vipExpiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)) : 0
  } : null;
  
  return {
    autoRenew: autoRenewInfo,
    colorSeparation: colorSeparationInfo,
    vip: vipInfo
  };
}

/**
 * Get statistics for all expired services
 */
export async function getExpiredServiceStats(): Promise<{
  expiredVip: number;
  expiredColorSeparation: number;
  expiredAutoRenew: number;
  totalExpired: number;
}> {
  const propertyRepository = AppDataSource.getRepository(Property);
  const now = new Date();
  
  try {
    const expiredVip = await propertyRepository.count({
      where: {
        vipStatus: MoreThan(VipStatusEnum.NONE),
        vipExpiresAt: LessThan(now)
      }
    });

    const expiredColorSeparation = await propertyRepository.count({
      where: {
        colorSeparationEnabled: true,
        colorSeparationExpiresAt: LessThan(now)
      }
    });

    const expiredAutoRenew = await propertyRepository.count({
      where: {
        autoRenewEnabled: true,
        autoRenewExpiresAt: LessThan(now)
      }
    });

    return {
      expiredVip,
      expiredColorSeparation,
      expiredAutoRenew,
      totalExpired: expiredVip + expiredColorSeparation + expiredAutoRenew
    };
  } catch (error) {
    console.error('Error getting expired service stats:', error);
    return { expiredVip: 0, expiredColorSeparation: 0, expiredAutoRenew: 0, totalExpired: 0 };
  }
}

/**
 * Manual trigger for all service expirations (for testing)
 */
export async function triggerServiceExpiration(): Promise<{
  vipExpired: number;
  colorSeparationExpired: number;
  stats: Awaited<ReturnType<typeof getExpiredServiceStats>>;
}> {
  console.log('🔧 Manual service expiration trigger initiated');
  
  const beforeStats = await getExpiredServiceStats();
  await expireServices();
  const afterStats = await getExpiredServiceStats();
  
  return {
    vipExpired: beforeStats.expiredVip,
    colorSeparationExpired: beforeStats.expiredColorSeparation,
    stats: afterStats
  };
}