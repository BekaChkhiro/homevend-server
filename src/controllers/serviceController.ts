import { Response } from 'express';
import { MoreThan } from 'typeorm';
import { AppDataSource } from '../config/database.js';
import { Property, ServiceTypeEnum } from '../models/Property.js';
import { PropertyService } from '../models/PropertyService.js';
import { ServicePricing } from '../models/ServicePricing.js';
import { User } from '../models/User.js';
import { Transaction, TransactionTypeEnum, TransactionStatusEnum } from '../models/Transaction.js';
import { AuthenticatedRequest } from '../types/auth.js';
import { createVipServiceTransactionMetadata, createTransactionDescription } from '../utils/transactionMetadata.js';

// Get all service pricing (VIP + additional services)
export const getServicePricing = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const servicePricingRepository = AppDataSource.getRepository(ServicePricing);
    
    const pricing = await servicePricingRepository.find({
      where: { isActive: true },
      order: { category: 'ASC', pricePerDay: 'ASC' }
    });

    // Separate VIP services and additional services
    const vipServices = pricing.filter(p => p.category === 'vip');
    const additionalServices = pricing.filter(p => p.category === 'service');

    res.status(200).json({
      success: true,
      data: {
        vipServices: vipServices.map(p => ({
          id: p.id,
          serviceType: p.serviceType,
          nameKa: p.nameKa,
          nameEn: p.nameEn,
          pricePerDay: parseFloat(p.pricePerDay.toString()),
          descriptionKa: p.descriptionKa,
          descriptionEn: p.descriptionEn,
          features: p.features || [],
          category: p.category
        })),
        additionalServices: additionalServices.map(p => ({
          id: p.id,
          serviceType: p.serviceType,
          nameKa: p.nameKa,
          nameEn: p.nameEn,
          pricePerDay: parseFloat(p.pricePerDay.toString()),
          descriptionKa: p.descriptionKa,
          descriptionEn: p.descriptionEn,
          features: p.features || [],
          category: p.category
        }))
      }
    });
  } catch (error) {
    console.error('Get service pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service pricing'
    });
  }
};

// Purchase services for property
export const purchaseServices = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
    const servicePricingRepository = queryRunner.manager.getRepository(ServicePricing);
    const propertyServiceRepository = queryRunner.manager.getRepository(PropertyService);
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
        message: 'You can only purchase services for your own properties'
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

      if (!Object.values(ServiceTypeEnum).includes(serviceType)) {
        await queryRunner.rollbackTransaction();
        res.status(400).json({
          success: false,
          message: `Invalid service type: ${serviceType}`
        });
        return;
      }

      // Get pricing for this service
      const servicePricing = await servicePricingRepository.findOne({
        where: { serviceType, isActive: true }
      });

      if (!servicePricing) {
        await queryRunner.rollbackTransaction();
        res.status(404).json({
          success: false,
          message: `Service pricing not found for type: ${serviceType}`
        });
        return;
      }

      const serviceCost = parseFloat(servicePricing.pricePerDay.toString()) * days;
      totalCost += serviceCost;

      serviceDetails.push({
        serviceType,
        days,
        colorCode: serviceType === ServiceTypeEnum.COLOR_SEPARATION ? (colorCode || '#FF5733') : null,
        pricePerDay: parseFloat(servicePricing.pricePerDay.toString()),
        totalCost: serviceCost,
        expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
        nameKa: servicePricing.nameKa,
        nameEn: servicePricing.nameEn
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

    // Create transaction record first
    const transaction = new Transaction();
    transaction.userId = userId;
    transaction.type = TransactionTypeEnum.SERVICE_PURCHASE;
    transaction.status = TransactionStatusEnum.COMPLETED;
    transaction.amount = totalCost;
    transaction.balanceBefore = user.balance + totalCost;
    transaction.balanceAfter = user.balance;
    // Create service details for metadata
    const serviceDetailsForMetadata = serviceDetails.map(s => ({
      serviceType: s.serviceType,
      days: s.days,
      pricePerDay: s.pricePerDay,
      totalCost: s.totalCost,
      expiresAt: new Date(Date.now() + s.days * 24 * 60 * 60 * 1000),
      colorCode: s.colorCode || null,
      autoRenewEnabled: s.serviceType === 'auto_renew'
    }));
    
    transaction.description = createTransactionDescription(serviceDetailsForMetadata, property.title);
    transaction.paymentMethod = 'balance';
    transaction.metadata = createVipServiceTransactionMetadata(propertyId, property.title, serviceDetailsForMetadata);

    const savedTransaction = await transactionRepository.save(transaction);

    // Create or update property services
    for (const serviceDetail of serviceDetails) {
      // Check if this service type already exists for this property
      let existingService = await propertyServiceRepository.findOne({
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

        existingService.transactionId = savedTransaction.id;
        await propertyServiceRepository.save(existingService);
      } else {
        // Create new service
        const newService = new PropertyService();
        newService.propertyId = propertyId;
        newService.serviceType = serviceDetail.serviceType;
        newService.expiresAt = serviceDetail.expiresAt;
        newService.isActive = true;
        newService.autoRenewEnabled = serviceDetail.serviceType === ServiceTypeEnum.AUTO_RENEW;
        newService.colorCode = serviceDetail.colorCode;
        newService.transactionId = savedTransaction.id;

        await propertyServiceRepository.save(newService);
      }

      // Update property status based on service type
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

    await queryRunner.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Services purchased successfully',
      data: {
        totalCost,
        newBalance: user.balance,
        services: serviceDetails,
        transactionId: savedTransaction.id
      }
    });

  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Purchase service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to purchase services'
    });
  } finally {
    await queryRunner.release();
  }
};

// Get property active services
export const getPropertyServices = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { propertyId } = req.params;
    
    const propertyServiceRepository = AppDataSource.getRepository(PropertyService);
    const servicePricingRepository = AppDataSource.getRepository(ServicePricing);
    
    const activeServices = await propertyServiceRepository.find({
      where: { 
        propertyId: parseInt(propertyId),
        isActive: true,
        expiresAt: MoreThan(new Date())
      },
      order: { expiresAt: 'DESC' }
    });

    // Get service names and details
    const servicesWithDetails = await Promise.all(
      activeServices.map(async (service) => {
        const pricing = await servicePricingRepository.findOne({
          where: { serviceType: service.serviceType }
        });

        return {
          id: service.id,
          serviceType: service.serviceType,
          nameKa: pricing?.nameKa || service.serviceType,
          nameEn: pricing?.nameEn || service.serviceType,
          category: pricing?.category || 'service',
          expiresAt: service.expiresAt,
          autoRenewEnabled: service.autoRenewEnabled,
          colorCode: service.colorCode,
          createdAt: service.createdAt
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        propertyId: parseInt(propertyId),
        hasActiveServices: servicesWithDetails.length > 0,
        services: servicesWithDetails
      }
    });

  } catch (error) {
    console.error('Get property services error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get property services'
    });
  }
};

// Get user's service transaction history
export const getServiceTransactionHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 10 } = req.query;

    const transactionRepository = AppDataSource.getRepository(Transaction);

    const [transactions, total] = await transactionRepository.findAndCount({
      where: {
        userId,
        type: TransactionTypeEnum.SERVICE_PURCHASE
      },
      order: { createdAt: 'DESC' },
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit)
    });

    res.status(200).json({
      success: true,
      data: {
        transactions: transactions.map(t => ({
          id: t.id,
          uuid: t.uuid,
          amount: parseFloat(t.amount.toString()),
          status: t.status,
          description: t.description,
          paymentMethod: t.paymentMethod,
          metadata: t.metadata,
          createdAt: t.createdAt
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get service transaction history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get service transaction history'
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
    const propertyServiceRepository = queryRunner.manager.getRepository(PropertyService);

    // Find properties with active auto-renew service
    const autoRenewServices = await propertyServiceRepository.find({
      where: {
        serviceType: ServiceTypeEnum.AUTO_RENEW,
        isActive: true,
        autoRenewEnabled: true,
        expiresAt: MoreThan(new Date())
      },
      relations: ['property']
    });

    for (const service of autoRenewServices) {
      // Update property's created_at to current date (renew)
      await propertyRepository.update(
        { id: service.propertyId },
        { createdAt: new Date() }
      );
      
      console.log(`Auto-renewed property ${service.propertyId}`);
    }

    await queryRunner.commitTransaction();
    console.log(`Processed ${autoRenewServices.length} auto-renewals`);

  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Auto-renewal process error:', error);
  } finally {
    await queryRunner.release();
  }
};