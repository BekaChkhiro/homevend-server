import { Request, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { Feature } from '../models/Feature.js';
import { Advantage } from '../models/Advantage.js';
import { FurnitureAppliance } from '../models/FurnitureAppliance.js';
import { Tag } from '../models/Tag.js';
import { PropertyTypeEnum, DealTypeEnum, BuildingStatusEnum, ConstructionYearEnum, ConditionEnum } from '../models/Property.js';

export const getFeatures = async (req: Request, res: Response): Promise<void> => {
  try {
    const { isActive = true } = req.query;
    const featureRepository = AppDataSource.getRepository(Feature);
    
    const features = await featureRepository.find({
      where: { isActive: isActive === 'true' },
      order: { sortOrder: 'ASC', nameGeorgian: 'ASC' }
    });
    
    res.status(200).json({
      success: true,
      data: features
    });
  } catch (error) {
    console.error('Get features error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch features'
    });
  }
};

export const getAdvantages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { isActive = true } = req.query;
    const advantageRepository = AppDataSource.getRepository(Advantage);
    
    const advantages = await advantageRepository.find({
      where: { isActive: isActive === 'true' },
      order: { sortOrder: 'ASC', nameGeorgian: 'ASC' }
    });
    
    res.status(200).json({
      success: true,
      data: advantages
    });
  } catch (error) {
    console.error('Get advantages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch advantages'
    });
  }
};

export const getFurnitureAppliances = async (req: Request, res: Response): Promise<void> => {
  try {
    const { isActive = true, category } = req.query;
    const furnitureRepository = AppDataSource.getRepository(FurnitureAppliance);
    
    const where: any = { isActive: isActive === 'true' };
    if (category) {
      where.category = category;
    }
    
    const furnitureAppliances = await furnitureRepository.find({
      where,
      order: { sortOrder: 'ASC', nameGeorgian: 'ASC' }
    });
    
    res.status(200).json({
      success: true,
      data: furnitureAppliances
    });
  } catch (error) {
    console.error('Get furniture/appliances error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch furniture/appliances'
    });
  }
};

export const getTags = async (req: Request, res: Response): Promise<void> => {
  try {
    const { isActive = true } = req.query;
    const tagRepository = AppDataSource.getRepository(Tag);
    
    const tags = await tagRepository.find({
      where: { isActive: isActive === 'true' },
      order: { sortOrder: 'ASC', nameGeorgian: 'ASC' }
    });
    
    res.status(200).json({
      success: true,
      data: tags
    });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tags'
    });
  }
};

export const getAllLookupData = async (req: Request, res: Response): Promise<void> => {
  try {
    const featureRepository = AppDataSource.getRepository(Feature);
    const advantageRepository = AppDataSource.getRepository(Advantage);
    const furnitureRepository = AppDataSource.getRepository(FurnitureAppliance);
    const tagRepository = AppDataSource.getRepository(Tag);
    
    const [features, advantages, furnitureAppliances, tags] = await Promise.all([
      featureRepository.find({
        where: { isActive: true },
        order: { sortOrder: 'ASC', nameGeorgian: 'ASC' }
      }),
      advantageRepository.find({
        where: { isActive: true },
        order: { sortOrder: 'ASC', nameGeorgian: 'ASC' }
      }),
      furnitureRepository.find({
        where: { isActive: true },
        order: { sortOrder: 'ASC', nameGeorgian: 'ASC' }
      }),
      tagRepository.find({
        where: { isActive: true },
        order: { sortOrder: 'ASC', nameGeorgian: 'ASC' }
      })
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        features,
        advantages,
        furnitureAppliances,
        tags,
        enums: {
          propertyTypes: Object.values(PropertyTypeEnum),
          dealTypes: Object.values(DealTypeEnum),
          buildingStatuses: Object.values(BuildingStatusEnum),
          constructionYears: Object.values(ConstructionYearEnum),
          conditions: Object.values(ConditionEnum)
        }
      }
    });
  } catch (error) {
    console.error('Get all lookup data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lookup data'
    });
  }
};

export const getEnums = async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      data: {
        propertyTypes: Object.values(PropertyTypeEnum),
        dealTypes: Object.values(DealTypeEnum),
        buildingStatuses: Object.values(BuildingStatusEnum),
        constructionYears: Object.values(ConstructionYearEnum),
        conditions: Object.values(ConditionEnum)
      }
    });
  } catch (error) {
    console.error('Get enums error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enums'
    });
  }
};