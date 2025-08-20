import { Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { PriceStatistic } from '../models/PriceStatistic.js';
import { District } from '../models/District.js';
import { AuthenticatedRequest } from '../types/auth.js';

export const getAllPriceStatistics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { districtId, propertyType, dealType, page = 1, limit = 20 } = req.query;
    
    const priceStatisticRepository = AppDataSource.getRepository(PriceStatistic);
    
    const where: any = { isActive: true };
    if (districtId) where.districtId = Number(districtId);
    if (propertyType) where.propertyType = propertyType;
    if (dealType) where.dealType = dealType;
    
    const [priceStatistics, total] = await priceStatisticRepository.findAndCount({
      where,
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
      order: { updatedAt: 'DESC' },
      relations: ['district']
    });
    
    res.status(200).json({
      success: true,
      data: {
        priceStatistics,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get price statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch price statistics'
    });
  }
};

export const getPriceStatisticById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const priceStatisticRepository = AppDataSource.getRepository(PriceStatistic);
    
    const priceStatistic = await priceStatisticRepository.findOne({
      where: { id: Number(id) },
      relations: ['district']
    });
    
    if (!priceStatistic) {
      res.status(404).json({
        success: false,
        message: 'Price statistic not found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: priceStatistic
    });
  } catch (error) {
    console.error('Get price statistic error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch price statistic'
    });
  }
};

export const getPriceStatisticsByDistrict = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { districtId } = req.params;
    const { propertyType, dealType } = req.query;
    
    const priceStatisticRepository = AppDataSource.getRepository(PriceStatistic);
    
    const where: any = { 
      districtId: Number(districtId),
      isActive: true 
    };
    if (propertyType) where.propertyType = propertyType;
    if (dealType) where.dealType = dealType;
    
    const priceStatistics = await priceStatisticRepository.find({
      where,
      order: { propertyType: 'ASC', dealType: 'ASC' },
      relations: ['district']
    });
    
    res.status(200).json({
      success: true,
      data: priceStatistics
    });
  } catch (error) {
    console.error('Get district price statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch district price statistics'
    });
  }
};

export const createPriceStatistic = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      districtId,
      propertyType,
      dealType,
      averagePricePerSqm,
      minPricePerSqm,
      maxPricePerSqm,
      currency,
      period,
      sampleSize,
      notes
    } = req.body;
    
    if (!districtId || !propertyType || !dealType || !averagePricePerSqm) {
      res.status(400).json({
        success: false,
        message: 'District ID, property type, deal type, and average price are required'
      });
      return;
    }
    
    const districtRepository = AppDataSource.getRepository(District);
    const priceStatisticRepository = AppDataSource.getRepository(PriceStatistic);
    
    // Check if district exists
    const district = await districtRepository.findOne({
      where: { id: Number(districtId) }
    });
    
    if (!district) {
      res.status(404).json({
        success: false,
        message: 'District not found'
      });
      return;
    }
    
    // Check if price statistic for this combination already exists
    const existingPriceStatistic = await priceStatisticRepository.findOne({
      where: {
        districtId: Number(districtId),
        propertyType,
        dealType,
        period: period || null
      }
    });
    
    if (existingPriceStatistic) {
      res.status(400).json({
        success: false,
        message: 'Price statistic for this combination already exists'
      });
      return;
    }
    
    const priceStatistic = priceStatisticRepository.create({
      districtId: Number(districtId),
      propertyType,
      dealType,
      averagePricePerSqm: Number(averagePricePerSqm),
      minPricePerSqm: minPricePerSqm ? Number(minPricePerSqm) : undefined,
      maxPricePerSqm: maxPricePerSqm ? Number(maxPricePerSqm) : undefined,
      currency: currency || 'USD',
      period,
      sampleSize: sampleSize ? Number(sampleSize) : 0,
      notes,
      isActive: true
    });
    
    await priceStatisticRepository.save(priceStatistic);
    
    // Fetch the created price statistic with district relation
    const createdPriceStatistic = await priceStatisticRepository.findOne({
      where: { id: priceStatistic.id },
      relations: ['district']
    });
    
    res.status(201).json({
      success: true,
      message: 'Price statistic created successfully',
      data: createdPriceStatistic
    });
  } catch (error) {
    console.error('Create price statistic error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create price statistic'
    });
  }
};

export const updatePriceStatistic = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      averagePricePerSqm,
      minPricePerSqm,
      maxPricePerSqm,
      currency,
      period,
      sampleSize,
      notes,
      isActive
    } = req.body;
    
    const priceStatisticRepository = AppDataSource.getRepository(PriceStatistic);
    
    const priceStatistic = await priceStatisticRepository.findOne({
      where: { id: Number(id) },
      relations: ['district']
    });
    
    if (!priceStatistic) {
      res.status(404).json({
        success: false,
        message: 'Price statistic not found'
      });
      return;
    }
    
    // Update fields
    if (averagePricePerSqm !== undefined) priceStatistic.averagePricePerSqm = Number(averagePricePerSqm);
    if (minPricePerSqm !== undefined) priceStatistic.minPricePerSqm = Number(minPricePerSqm);
    if (maxPricePerSqm !== undefined) priceStatistic.maxPricePerSqm = Number(maxPricePerSqm);
    if (currency !== undefined) priceStatistic.currency = currency;
    if (period !== undefined) priceStatistic.period = period;
    if (sampleSize !== undefined) priceStatistic.sampleSize = Number(sampleSize);
    if (notes !== undefined) priceStatistic.notes = notes;
    if (isActive !== undefined) priceStatistic.isActive = isActive;
    
    await priceStatisticRepository.save(priceStatistic);
    
    res.status(200).json({
      success: true,
      message: 'Price statistic updated successfully',
      data: priceStatistic
    });
  } catch (error) {
    console.error('Update price statistic error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update price statistic'
    });
  }
};

export const deletePriceStatistic = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const priceStatisticRepository = AppDataSource.getRepository(PriceStatistic);
    
    const priceStatistic = await priceStatisticRepository.findOne({
      where: { id: Number(id) }
    });
    
    if (!priceStatistic) {
      res.status(404).json({
        success: false,
        message: 'Price statistic not found'
      });
      return;
    }
    
    await priceStatisticRepository.remove(priceStatistic);
    
    res.status(200).json({
      success: true,
      message: 'Price statistic deleted successfully'
    });
  } catch (error) {
    console.error('Delete price statistic error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete price statistic'
    });
  }
};

export const getDistrictPriceOverview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const priceStatisticRepository = AppDataSource.getRepository(PriceStatistic);
    
    // Get overview data grouped by districts
    const overview = await priceStatisticRepository
      .createQueryBuilder('ps')
      .leftJoinAndSelect('ps.district', 'district')
      .where('ps.isActive = :isActive', { isActive: true })
      .orderBy('district.nameKa', 'ASC')
      .addOrderBy('ps.propertyType', 'ASC')
      .addOrderBy('ps.dealType', 'ASC')
      .getMany();
    
    // Group by districts
    const groupedData = overview.reduce((acc, item) => {
      const districtName = item.district.nameKa;
      if (!acc[districtName]) {
        acc[districtName] = {
          district: item.district,
          statistics: []
        };
      }
      acc[districtName].statistics.push(item);
      return acc;
    }, {} as any);
    
    res.status(200).json({
      success: true,
      data: Object.values(groupedData)
    });
  } catch (error) {
    console.error('Get price overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch price overview'
    });
  }
};