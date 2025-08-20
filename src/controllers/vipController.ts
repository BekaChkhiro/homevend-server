import { Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { Property, VipStatusEnum } from '../models/Property.js';
import { VipPricing } from '../models/VipPricing.js';
import { User } from '../models/User.js';
import { Transaction, TransactionTypeEnum, TransactionStatusEnum } from '../models/Transaction.js';
import { AuthenticatedRequest } from '../types/auth.js';

// Get VIP pricing options
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
        vipType: p.vipType,
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

// Purchase VIP status for property
export const purchaseVipStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const userId = req.user!.id;
    const { propertyId, vipType, days } = req.body;

    // Validate input
    if (!propertyId || !vipType || !days) {
      res.status(400).json({
        success: false,
        message: 'Property ID, VIP type, and days are required'
      });
      return;
    }

    if (days < 1 || days > 30) {
      res.status(400).json({
        success: false,
        message: 'Days must be between 1 and 30'
      });
      return;
    }

    if (!Object.values(VipStatusEnum).includes(vipType) || vipType === VipStatusEnum.NONE) {
      res.status(400).json({
        success: false,
        message: 'Invalid VIP type'
      });
      return;
    }

    const userRepository = queryRunner.manager.getRepository(User);
    const propertyRepository = queryRunner.manager.getRepository(Property);
    const vipPricingRepository = queryRunner.manager.getRepository(VipPricing);
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
      select: ['id', 'userId', 'title', 'vipStatus', 'vipExpiresAt']
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
        message: 'You can only purchase VIP status for your own properties'
      });
      return;
    }

    // Get VIP pricing
    const vipPricing = await vipPricingRepository.findOne({
      where: { vipType: vipType, isActive: true }
    });

    if (!vipPricing) {
      await queryRunner.rollbackTransaction();
      res.status(404).json({
        success: false,
        message: 'VIP pricing not found'
      });
      return;
    }

    // Calculate total cost
    const pricePerDay = parseFloat(vipPricing.pricePerDay.toString());
    const totalCost = pricePerDay * days;
    const currentBalance = parseFloat(user.balance.toString());

    if (currentBalance < totalCost) {
      await queryRunner.rollbackTransaction();
      res.status(400).json({
        success: false,
        message: `Insufficient balance. Required: ${totalCost.toFixed(2)}₾, Available: ${currentBalance.toFixed(2)}₾`
      });
      return;
    }

    // Calculate new expiration date
    const now = new Date();
    let newExpiresAt: Date;

    if (property.vipExpiresAt && property.vipExpiresAt > now && property.vipStatus === vipType) {
      // Extend existing VIP of same type
      newExpiresAt = new Date(property.vipExpiresAt.getTime() + (days * 24 * 60 * 60 * 1000));
    } else {
      // New VIP or different type
      newExpiresAt = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    }

    const newBalance = currentBalance - totalCost;

    // Create transaction record
    const transaction = transactionRepository.create({
      userId: userId,
      type: TransactionTypeEnum.VIP_PURCHASE,
      status: TransactionStatusEnum.COMPLETED,
      amount: totalCost,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      description: `VIP ${vipType.replace('_', '+')} purchase for property "${property.title}" (${days} days)`,
      paymentMethod: 'balance',
      metadata: {
        propertyId: propertyId,
        vipType: vipType,
        days: days,
        pricePerDay: pricePerDay
      }
    });

    await transactionRepository.save(transaction);

    // Update user balance
    user.balance = newBalance;
    await userRepository.save(user);

    // Update property VIP status
    property.vipStatus = vipType;
    property.vipExpiresAt = newExpiresAt;
    await propertyRepository.save(property);

    await queryRunner.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'VIP status purchased successfully',
      data: {
        transactionId: transaction.uuid,
        propertyId: propertyId,
        vipType: vipType,
        days: days,
        totalCost: totalCost,
        expiresAt: newExpiresAt.toISOString(),
        newBalance: newBalance
      }
    });

  } catch (error) {
    console.error('Purchase VIP status error:', error);
    await queryRunner.rollbackTransaction();
    res.status(500).json({
      success: false,
      message: 'Failed to purchase VIP status'
    });
  } finally {
    await queryRunner.release();
  }
};

// Get property VIP status
export const getPropertyVipStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { propertyId } = req.params;
    const userId = req.user!.id;

    const propertyRepository = AppDataSource.getRepository(Property);
    
    const property = await propertyRepository.findOne({
      where: { id: parseInt(propertyId), userId: userId },
      select: ['id', 'title', 'vipStatus', 'vipExpiresAt']
    });

    if (!property) {
      res.status(404).json({
        success: false,
        message: 'Property not found'
      });
      return;
    }

    const now = new Date();
    const isExpired = property.vipExpiresAt ? property.vipExpiresAt <= now : false;

    res.status(200).json({
      success: true,
      data: {
        propertyId: property.id,
        title: property.title,
        vipStatus: isExpired ? VipStatusEnum.NONE : property.vipStatus,
        vipExpiresAt: property.vipExpiresAt?.toISOString() || null,
        isExpired: isExpired,
        daysRemaining: property.vipExpiresAt && !isExpired ? 
          Math.ceil((property.vipExpiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)) : 0
      }
    });
  } catch (error) {
    console.error('Get property VIP status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch property VIP status'
    });
  }
};

// Admin: Update VIP pricing
export const updateVipPricing = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { vipType } = req.params;
    const { pricePerDay, descriptionKa, descriptionEn, features, isActive } = req.body;

    if (!Object.values(VipStatusEnum).includes(vipType as VipStatusEnum) || vipType === VipStatusEnum.NONE) {
      res.status(400).json({
        success: false,
        message: 'Invalid VIP type'
      });
      return;
    }

    const vipPricingRepository = AppDataSource.getRepository(VipPricing);
    
    let pricing = await vipPricingRepository.findOne({
      where: { vipType: vipType as VipStatusEnum }
    });

    if (!pricing) {
      res.status(404).json({
        success: false,
        message: 'VIP pricing not found'
      });
      return;
    }

    // Update pricing
    if (pricePerDay !== undefined) pricing.pricePerDay = pricePerDay;
    if (descriptionKa !== undefined) pricing.descriptionKa = descriptionKa;
    if (descriptionEn !== undefined) pricing.descriptionEn = descriptionEn;
    if (features !== undefined) pricing.features = features;
    if (isActive !== undefined) pricing.isActive = isActive;

    await vipPricingRepository.save(pricing);

    res.status(200).json({
      success: true,
      message: 'VIP pricing updated successfully',
      data: {
        id: pricing.id,
        vipType: pricing.vipType,
        pricePerDay: parseFloat(pricing.pricePerDay.toString()),
        descriptionKa: pricing.descriptionKa,
        descriptionEn: pricing.descriptionEn,
        features: pricing.features || [],
        isActive: pricing.isActive
      }
    });
  } catch (error) {
    console.error('Update VIP pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update VIP pricing'
    });
  }
};