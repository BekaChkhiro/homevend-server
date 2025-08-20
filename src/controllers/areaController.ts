import { Request, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { Area } from '../models/Area.js';

export const getAllAreas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cityId } = req.query;
    const areaRepository = AppDataSource.getRepository(Area);
    
    let where: any = { isActive: true };
    if (cityId) {
      where.cityId = Number(cityId);
    }
    
    const areas = await areaRepository.find({
      where,
      order: { nameKa: 'ASC' },
      relations: ['city']
    });
    
    res.status(200).json({
      success: true,
      data: areas
    });
  } catch (error) {
    console.error('Get areas error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch areas'
    });
  }
};

export const getAreaById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const areaRepository = AppDataSource.getRepository(Area);
    
    const area = await areaRepository.findOne({
      where: { id: Number(id) },
      relations: ['city']
    });
    
    if (!area) {
      res.status(404).json({
        success: false,
        message: 'Area not found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: area
    });
  } catch (error) {
    console.error('Get area error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch area'
    });
  }
};

export const getAreasByCity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cityId } = req.params;
    
    if (!cityId || isNaN(Number(cityId))) {
      res.status(400).json({
        success: false,
        message: 'Invalid city ID provided'
      });
      return;
    }
    
    const areaRepository = AppDataSource.getRepository(Area);
    
    const areas = await areaRepository.find({
      where: { 
        cityId: Number(cityId),
        isActive: true 
      },
      order: { nameKa: 'ASC' }
    });
    
    res.status(200).json({
      success: true,
      data: areas
    });
  } catch (error) {
    console.error('Get areas by city error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch areas for this city'
    });
  }
};