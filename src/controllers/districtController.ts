import { Response } from 'express';
import { Not } from 'typeorm';
import { AppDataSource } from '../config/database.js';
import { District } from '../models/District.js';
import { PriceStatistic } from '../models/PriceStatistic.js';
import { AuthenticatedRequest } from '../types/auth.js';

export const getAllDistricts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const districtRepository = AppDataSource.getRepository(District);
    
    const districts = await districtRepository.find({
      where: { isActive: true },
      order: { nameKa: 'ASC' },
      relations: ['priceStatistics']
    });
    
    // Add current price to each district
    const districtsWithPrices = districts.map(district => {
      const generalPrice = district.priceStatistics?.find(
        stat => stat.propertyType === 'general' && stat.dealType === 'sale' && stat.isActive
      );
      
      return {
        ...district,
        currentPricePerSqm: generalPrice?.averagePricePerSqm || null
      };
    });
    
    res.status(200).json({
      success: true,
      data: districtsWithPrices
    });
  } catch (error) {
    console.error('Get districts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch districts'
    });
  }
};

export const getDistrictById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const districtRepository = AppDataSource.getRepository(District);
    
    const district = await districtRepository.findOne({
      where: { id: Number(id) },
      relations: ['priceStatistics']
    });
    
    if (!district) {
      res.status(404).json({
        success: false,
        message: 'District not found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: district
    });
  } catch (error) {
    console.error('Get district error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch district'
    });
  }
};

export const createDistrict = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { nameKa, nameEn, nameRu, description, pricePerSqm } = req.body;
    
    if (!nameKa || !nameEn || !nameRu || !pricePerSqm) {
      res.status(400).json({
        success: false,
        message: 'Georgian name, English name, Russian name, and price per square meter are required'
      });
      return;
    }
    
    const districtRepository = AppDataSource.getRepository(District);
    const priceStatisticRepository = AppDataSource.getRepository(PriceStatistic);
    
    // Check if district with same name already exists
    const existingDistrict = await districtRepository.findOne({
      where: [
        { nameKa },
        { nameEn },
        { nameRu }
      ]
    });
    
    if (existingDistrict) {
      res.status(400).json({
        success: false,
        message: 'District with this name already exists'
      });
      return;
    }
    
    const district = districtRepository.create({
      nameKa,
      nameEn,
      nameRu,
      description,
      isActive: true
    });
    
    await districtRepository.save(district);
    
    // Create default price statistic for the district
    const priceStatistic = priceStatisticRepository.create({
      districtId: district.id,
      propertyType: 'general',
      dealType: 'sale',
      averagePricePerSqm: Number(pricePerSqm),
      currency: 'USD',
      sampleSize: 0,
      isActive: true
    });
    
    await priceStatisticRepository.save(priceStatistic);
    
    res.status(201).json({
      success: true,
      message: 'District created successfully',
      data: district
    });
  } catch (error) {
    console.error('Create district error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create district'
    });
  }
};

export const updateDistrict = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nameKa, nameEn, nameRu, description, isActive, pricePerSqm } = req.body;
    
    const districtRepository = AppDataSource.getRepository(District);
    const priceStatisticRepository = AppDataSource.getRepository(PriceStatistic);
    
    const district = await districtRepository.findOne({
      where: { id: Number(id) }
    });
    
    if (!district) {
      res.status(404).json({
        success: false,
        message: 'District not found'
      });
      return;
    }
    
    // Check if another district with same name exists
    if (nameKa || nameEn || nameRu) {
      const existingDistrict = await districtRepository.findOne({
        where: [
          { nameKa: nameKa || district.nameKa, id: Not(Number(id)) },
          { nameEn: nameEn || district.nameEn, id: Not(Number(id)) },
          { nameRu: nameRu || district.nameRu, id: Not(Number(id)) }
        ]
      });
      
      if (existingDistrict) {
        res.status(400).json({
          success: false,
          message: 'District with this name already exists'
        });
        return;
      }
    }
    
    district.nameKa = nameKa || district.nameKa;
    district.nameEn = nameEn || district.nameEn;
    district.nameRu = nameRu || district.nameRu;
    district.description = description !== undefined ? description : district.description;
    district.isActive = isActive !== undefined ? isActive : district.isActive;
    
    await districtRepository.save(district);
    
    // Update price statistic if provided
    if (pricePerSqm) {
      let priceStatistic = await priceStatisticRepository.findOne({
        where: { 
          districtId: Number(id), 
          propertyType: 'general',
          dealType: 'sale'
        }
      });
      
      if (priceStatistic) {
        priceStatistic.averagePricePerSqm = Number(pricePerSqm);
        await priceStatisticRepository.save(priceStatistic);
      } else {
        // Create new price statistic if it doesn't exist
        priceStatistic = priceStatisticRepository.create({
          districtId: Number(id),
          propertyType: 'general',
          dealType: 'sale',
          averagePricePerSqm: Number(pricePerSqm),
          currency: 'USD',
          sampleSize: 0,
          isActive: true
        });
        await priceStatisticRepository.save(priceStatistic);
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'District updated successfully',
      data: district
    });
  } catch (error) {
    console.error('Update district error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update district'
    });
  }
};

export const deleteDistrict = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const districtRepository = AppDataSource.getRepository(District);
    const priceStatisticRepository = AppDataSource.getRepository(PriceStatistic);
    
    const district = await districtRepository.findOne({
      where: { id: Number(id) }
    });
    
    if (!district) {
      res.status(404).json({
        success: false,
        message: 'District not found'
      });
      return;
    }
    
    // Check if district has price statistics
    const priceStatisticsCount = await priceStatisticRepository.count({
      where: { districtId: Number(id) }
    });
    
    if (priceStatisticsCount > 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete district with existing price statistics'
      });
      return;
    }
    
    await districtRepository.remove(district);
    
    res.status(200).json({
      success: true,
      message: 'District deleted successfully'
    });
  } catch (error) {
    console.error('Delete district error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete district'
    });
  }
};