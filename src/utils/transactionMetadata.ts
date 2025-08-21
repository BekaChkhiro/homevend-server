/**
 * Utility functions for creating comprehensive transaction metadata
 * to track detailed service purchase information
 */

import { VipStatusEnum } from '../models/Property.js';

export interface ServiceDetail {
  serviceType: string;
  days: number;
  pricePerDay: number;
  totalCost: number;
  expiresAt: Date;
  colorCode?: string | null;
  autoRenewEnabled?: boolean;
}

export interface TransactionMetadata {
  propertyId: number;
  propertyTitle: string;
  purchaseType: 'vip_only' | 'services_only' | 'vip_and_services';
  vipService?: {
    serviceType: string;
    serviceCategory: 'vip';
    days: number;
    pricePerDay: number;
    totalCost: number;
    expiresAt: string;
    colorCode?: string | null;
    previousStatus?: string;
    previousExpiresAt?: string | null;
  } | null;
  additionalServices: Array<{
    serviceType: string;
    serviceCategory: 'additional';
    days: number;
    pricePerDay: number;
    totalCost: number;
    expiresAt: string;
    colorCode?: string | null;
    autoRenewEnabled?: boolean;
  }>;
  costBreakdown: {
    vipCost: number;
    servicesCost: number;
    totalCost: number;
  };
  purchaseDetails: {
    purchasedAt: string;
    paymentMethod: string;
    balanceUsed: number;
    totalServices?: number;
  };
  // Keep legacy services array for backward compatibility
  services?: ServiceDetail[];
}

/**
 * Creates comprehensive metadata for VIP service transactions
 */
export function createVipServiceTransactionMetadata(
  propertyId: number,
  propertyTitle: string,
  serviceDetails: ServiceDetail[]
): TransactionMetadata {
  const vipServices = serviceDetails.filter(s => 
    ['vip', 'vip_plus', 'super_vip'].includes(s.serviceType)
  );
  const additionalServices = serviceDetails.filter(s => 
    ['auto_renew', 'color_separation'].includes(s.serviceType)
  );

  const vipCost = vipServices.reduce((sum, s) => sum + s.totalCost, 0);
  const servicesCost = additionalServices.reduce((sum, s) => sum + s.totalCost, 0);
  const totalCost = vipCost + servicesCost;

  // Determine purchase type
  let purchaseType: TransactionMetadata['purchaseType'];
  if (vipServices.length > 0 && additionalServices.length > 0) {
    purchaseType = 'vip_and_services';
  } else if (vipServices.length > 0) {
    purchaseType = 'vip_only';
  } else {
    purchaseType = 'services_only';
  }

  return {
    propertyId,
    propertyTitle,
    purchaseType,
    vipService: vipServices.length > 0 ? {
      serviceType: vipServices[0].serviceType,
      serviceCategory: 'vip',
      days: vipServices[0].days,
      pricePerDay: vipServices[0].pricePerDay,
      totalCost: vipServices[0].totalCost,
      expiresAt: vipServices[0].expiresAt.toISOString(),
      colorCode: vipServices[0].colorCode || null
    } : null,
    additionalServices: additionalServices.map(service => ({
      serviceType: service.serviceType,
      serviceCategory: 'additional',
      days: service.days,
      pricePerDay: service.pricePerDay,
      totalCost: service.totalCost,
      expiresAt: service.expiresAt.toISOString(),
      colorCode: service.colorCode || null,
      autoRenewEnabled: service.serviceType === 'auto_renew'
    })),
    costBreakdown: {
      vipCost,
      servicesCost,
      totalCost
    },
    purchaseDetails: {
      purchasedAt: new Date().toISOString(),
      paymentMethod: 'balance',
      balanceUsed: totalCost,
      totalServices: serviceDetails.length
    },
    // Keep legacy format for backward compatibility
    services: serviceDetails
  };
}

/**
 * Creates comprehensive metadata for single VIP status transactions
 */
export function createVipStatusTransactionMetadata(
  propertyId: number,
  propertyTitle: string,
  vipType: string,
  days: number,
  pricePerDay: number,
  totalCost: number,
  expiresAt: Date,
  previousStatus?: string,
  previousExpiresAt?: Date
): TransactionMetadata {
  return {
    propertyId,
    propertyTitle,
    purchaseType: 'vip_only',
    vipService: {
      serviceType: vipType,
      serviceCategory: 'vip',
      days,
      pricePerDay,
      totalCost,
      expiresAt: expiresAt.toISOString(),
      previousStatus: previousStatus || VipStatusEnum.NONE,
      previousExpiresAt: previousExpiresAt?.toISOString() || null
    },
    additionalServices: [],
    costBreakdown: {
      vipCost: totalCost,
      servicesCost: 0,
      totalCost
    },
    purchaseDetails: {
      purchasedAt: new Date().toISOString(),
      paymentMethod: 'balance',
      balanceUsed: totalCost
    }
  };
}

// Service name translations
const SERVICE_NAMES = {
  vip: 'VIP',
  vip_plus: 'VIP+',
  super_vip: 'SUPER VIP',
  auto_renew: 'ავტო განახლება',
  color_separation: 'ფერადი გამოყოფა'
};

/**
 * Creates a detailed transaction description based on purchased services
 */
export function createTransactionDescription(
  serviceDetails: ServiceDetail[],
  propertyTitle: string
): string {
  const serviceDescriptions: string[] = [];
  
  const vipServices = serviceDetails.filter(s => 
    ['vip', 'vip_plus', 'super_vip'].includes(s.serviceType)
  );
  const additionalServices = serviceDetails.filter(s => 
    ['auto_renew', 'color_separation'].includes(s.serviceType)
  );
  
  // Add VIP service description
  if (vipServices.length > 0) {
    const vip = vipServices[0];
    const vipLabel = SERVICE_NAMES[vip.serviceType as keyof typeof SERVICE_NAMES] || vip.serviceType;
    serviceDescriptions.push(`${vipLabel} (${vip.days} დღე)`);
  }
  
  // Add additional services descriptions
  additionalServices.forEach(service => {
    const serviceName = SERVICE_NAMES[service.serviceType as keyof typeof SERVICE_NAMES] || service.serviceType;
    serviceDescriptions.push(`${serviceName} (${service.days} დღე)`);
  });
  
  if (serviceDescriptions.length === 0) {
    return `სერვისების შეძენა - ${propertyTitle}`;
  }
  
  return `${serviceDescriptions.join(' + ')} - ${propertyTitle}`;
}

/**
 * Creates a simple VIP transaction description
 */
export function createVipTransactionDescription(
  vipType: string,
  days: number,
  propertyTitle: string
): string {
  const vipLabel = SERVICE_NAMES[vipType as keyof typeof SERVICE_NAMES] || vipType.replace('_', '+').toUpperCase();
  return `${vipLabel} (${days} დღე) - ${propertyTitle}`;
}