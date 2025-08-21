import { Response } from 'express';
import { MoreThan } from 'typeorm';
import { AppDataSource } from '../config/database.js';
import { Property, VipStatusEnum, ServiceTypeEnum } from '../models/Property.js';
import { PropertyService } from '../models/PropertyService.js';
import { VipPricing } from '../models/VipPricing.js';
import { User } from '../models/User.js';
import { Transaction, TransactionTypeEnum, TransactionStatusEnum } from '../models/Transaction.js';
import { AuthenticatedRequest } from '../types/auth.js';
import { createVipServiceTransactionMetadata, createTransactionDescription } from '../utils/transactionMetadata.js';
import { expireServices } from '../utils/serviceExpiration.js';

// Get VIP pricing options including new services
export const getVipPricing = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const vipPricingRepository = AppDataSource.getRepository(VipPricing);
    
    const pricing = await vipPricingRepository.find({
      where: { isActive: true },
      order: { pricePerDay: 'ASC' }
    });

    res.status(200).json({
      success: true,
      data: pricing.map(p => ({
        id: p.id,
        serviceType: p.vipType,
        pricePerDay: parseFloat(p.pricePerDay.toString()),
        descriptionKa: p.descriptionKa,
        descriptionEn: p.descriptionEn,
        features: p.features || []
      }))
    });
  } catch (error) {
    console.error('Get VIP pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch VIP pricing'
    });
  }
};

// Purchase VIP service for property (supports multiple services)
export const purchaseVipService = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const userId = req.user!.id;
    const { propertyId, services } = req.body; // services is an array of { serviceType, days, colorCode? }

    // Validate input
    if (!propertyId || !services || !Array.isArray(services) || services.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Property ID and services array are required'
      });
      return;
    }

    const userRepository = queryRunner.manager.getRepository(User);
    const propertyRepository = queryRunner.manager.getRepository(Property);
    const vipPricingRepository = queryRunner.manager.getRepository(VipPricing);
    const vipServiceRepository = queryRunner.manager.getRepository(PropertyService);
    const transactionRepository = queryRunner.manager.getRepository(Transaction);

    // Get user with current balance
    const user = await userRepository.findOne({
      where: { id: userId },
      select: ['id', 'fullName', 'email', 'balance']
    });

    if (!user) {
      await queryRunner.rollbackTransaction();
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Get property and verify ownership
    const property = await propertyRepository.findOne({
      where: { id: propertyId },
      select: ['id', 'userId', 'title']
    });

    if (!property) {
      await queryRunner.rollbackTransaction();
      res.status(404).json({
        success: false,
        message: 'Property not found'
      });
      return;
    }

    if (property.userId !== userId) {
      await queryRunner.rollbackTransaction();
      res.status(403).json({
        success: false,
        message: 'You can only purchase VIP services for your own properties'
      });
      return;
    }

    // Calculate total cost and validate services
    let totalCost = 0;
    const serviceDetails: any[] = [];

    for (const service of services) {
      const { serviceType, days, colorCode } = service;

      if (!serviceType || !days) {
        await queryRunner.rollbackTransaction();
        res.status(400).json({
          success: false,
          message: 'Each service must have serviceType and days'
        });
        return;
      }

      if (days < 1 || days > 30) {
        await queryRunner.rollbackTransaction();
        res.status(400).json({
          success: false,
          message: 'Days must be between 1 and 30'
        });
        return;
      }

      if (!Object.values(VipStatusEnum).includes(serviceType) || serviceType === VipStatusEnum.NONE) {
        await queryRunner.rollbackTransaction();
        res.status(400).json({
          success: false,
          message: `Invalid VIP type: ${serviceType}`
        });
        return;
      }

      // Get pricing for this service
      const vipPricing = await vipPricingRepository.findOne({
        where: { vipType: serviceType, isActive: true }
      });

      if (!vipPricing) {
        await queryRunner.rollbackTransaction();
        res.status(404).json({
          success: false,
          message: `VIP pricing not found for type: ${serviceType}`
        });
        return;
      }

      const serviceCost = parseFloat(vipPricing.pricePerDay.toString()) * days;
      totalCost += serviceCost;

      serviceDetails.push({
        serviceType,
        days,
        colorCode: serviceType === ServiceTypeEnum.COLOR_SEPARATION ? (colorCode || '#FF5733') : null,
        pricePerDay: parseFloat(vipPricing.pricePerDay.toString()),
        totalCost: serviceCost,
        expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      });
    }

    // Check if user has enough balance
    if (user.balance < totalCost) {
      await queryRunner.rollbackTransaction();
      res.status(400).json({
        success: false,
        message: `Insufficient balance. Required: ${totalCost.toFixed(2)}₾, Available: ${user.balance.toFixed(2)}₾`
      });
      return;
    }

    // Deduct balance
    user.balance -= totalCost;
    await userRepository.save(user);

    // Create or update VIP services
    for (const serviceDetail of serviceDetails) {
      // Check if this service type already exists for this property
      let existingService = await vipServiceRepository.findOne({
        where: { 
          propertyId: propertyId, 
          serviceType: serviceDetail.serviceType,
          isActive: true 
        }
      });

      if (existingService) {
        // Extend existing service
        const currentExpiry = existingService.expiresAt;
        const extensionStart = currentExpiry > new Date() ? currentExpiry : new Date();
        existingService.expiresAt = new Date(extensionStart.getTime() + serviceDetail.days * 24 * 60 * 60 * 1000);
        
        if (serviceDetail.colorCode) {
          existingService.colorCode = serviceDetail.colorCode;
        }
        
        if (serviceDetail.serviceType === ServiceTypeEnum.AUTO_RENEW) {
          existingService.autoRenewEnabled = true;
        }

        await vipServiceRepository.save(existingService);
      } else {
        // Create new service
        const newService = new PropertyService();
        newService.propertyId = propertyId;
        newService.serviceType = serviceDetail.serviceType;
        newService.expiresAt = serviceDetail.expiresAt;
        newService.isActive = true;
        newService.autoRenewEnabled = serviceDetail.serviceType === ServiceTypeEnum.AUTO_RENEW;
        newService.colorCode = serviceDetail.colorCode;

        await vipServiceRepository.save(newService);
      }
    }

    // Update property service status based on purchased services
    for (const serviceDetail of serviceDetails) {
      if (['vip', 'vip_plus', 'super_vip'].includes(serviceDetail.serviceType)) {
        // Update VIP status
        property.vipStatus = serviceDetail.serviceType as any;
        property.vipExpiresAt = serviceDetail.expiresAt;
      } else if (serviceDetail.serviceType === ServiceTypeEnum.AUTO_RENEW) {
        // Update auto-renew status
        const currentExpiry = property.autoRenewExpiresAt;
        const extensionStart = currentExpiry && currentExpiry > new Date() ? currentExpiry : new Date();
        property.autoRenewEnabled = true;
        property.autoRenewExpiresAt = new Date(extensionStart.getTime() + serviceDetail.days * 24 * 60 * 60 * 1000);
      } else if (serviceDetail.serviceType === ServiceTypeEnum.COLOR_SEPARATION) {
        // Update color separation status
        const currentExpiry = property.colorSeparationExpiresAt;
        const extensionStart = currentExpiry && currentExpiry > new Date() ? currentExpiry : new Date();
        property.colorSeparationEnabled = true;
        property.colorSeparationExpiresAt = new Date(extensionStart.getTime() + serviceDetail.days * 24 * 60 * 60 * 1000);
      }
    }
    
    // Save property with updated service status
    await propertyRepository.save(property);

    // Create transaction record
    const transaction = new Transaction();
    transaction.userId = userId;
    // Set transaction type based on what was purchased
    const hasVipServices = serviceDetails.some(s => ['vip', 'vip_plus', 'super_vip'].includes(s.serviceType));
    const hasAdditionalServices = serviceDetails.some(s => ['auto_renew', 'color_separation'].includes(s.serviceType));
    
    if (hasVipServices && hasAdditionalServices) {
      transaction.type = TransactionTypeEnum.VIP_PURCHASE; // VIP + Services
    } else if (hasVipServices) {
      transaction.type = TransactionTypeEnum.VIP_PURCHASE; // VIP only
    } else {
      transaction.type = TransactionTypeEnum.SERVICE_PURCHASE; // Services only
    }
    transaction.status = TransactionStatusEnum.COMPLETED;
    transaction.amount = totalCost;
    transaction.balanceBefore = user.balance + totalCost;
    transaction.balanceAfter = user.balance;
    transaction.description = createTransactionDescription(serviceDetails, property.title);
    transaction.paymentMethod = 'balance';
    transaction.metadata = createVipServiceTransactionMetadata(propertyId, property.title, serviceDetails);

    await transactionRepository.save(transaction);

    await queryRunner.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'VIP services purchased successfully',
      data: {
        totalCost,
        newBalance: user.balance,
        services: serviceDetails,
        transactionId: transaction.id
      }
    });

  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Purchase VIP service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to purchase VIP service'
    });
  } finally {
    await queryRunner.release();
  }
};

// Get property VIP status and active services
export const getPropertyVipStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { propertyId } = req.params;
    
    const vipServiceRepository = AppDataSource.getRepository(PropertyService);
    
    const activeServices = await vipServiceRepository.find({
      where: { 
        propertyId: parseInt(propertyId),
        isActive: true,
        expiresAt: MoreThan(new Date())
      },
      order: { expiresAt: 'DESC' }
    });

    res.status(200).json({
      success: true,
      data: {
        propertyId: parseInt(propertyId),
        hasActiveServices: activeServices.length > 0,
        services: activeServices.map(service => ({
          id: service.id,
          serviceType: service.serviceType,
          expiresAt: service.expiresAt,
          autoRenewEnabled: service.autoRenewEnabled,
          colorCode: service.colorCode,
          createdAt: service.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Get property VIP status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get property VIP status'
    });
  }
};

// Auto-renew job function (to be called by a cron job)
export const processAutoRenewal = async (): Promise<void> => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const propertyRepository = queryRunner.manager.getRepository(Property);

    // Find properties with active auto-renew service
    const propertiesWithAutoRenew = await propertyRepository.find({
      where: {
        autoRenewEnabled: true,
        autoRenewExpiresAt: MoreThan(new Date())
      }
    });

    for (const property of propertiesWithAutoRenew) {
      // Update property's created_at to current date (renew)
      property.createdAt = new Date();
      await propertyRepository.save(property);
      
      console.log(`Auto-renewed property ${property.id}`);
    }

    // Also expire services that have expired
    await expireServices();

    await queryRunner.commitTransaction();
    console.log(`Processed ${propertiesWithAutoRenew.length} auto-renewals`);

  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Auto-renewal process error:', error);
  } finally {
    await queryRunner.release();
  }
};