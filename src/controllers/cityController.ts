import { Request, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { City } from '../models/City.js';
import { District } from '../models/District.js';
import { AuthenticatedRequest } from '../types/auth.js';
import { ILike } from 'typeorm';

export const getAllCities = async (req: Request, res: Response): Promise<void> => {
  try {
    const { isActive } = req.query;
    const cityRepository = AppDataSource.getRepository(City);
    
    let whereCondition = {};
    if (isActive !== undefined) {
      whereCondition = { isActive: isActive === 'true' };
    }
    
    const cities = await cityRepository.find({
      where: whereCondition,
      order: { nameGeorgian: 'ASC' }
    });
    
    res.status(200).json({
      success: true,
      data: cities
    });
  } catch (error) {
    console.error('Get cities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cities'
    });
  }
};

export const getCityById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const cityRepository = AppDataSource.getRepository(City);
    
    const city = await cityRepository.findOne({
      where: { id: parseInt(id) }
    });
    
    if (!city) {
      res.status(404).json({
        success: false,
        message: 'City not found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: city
    });
  } catch (error) {
    console.error('Get city error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch city'
    });
  }
};

export const createCity = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { code, nameGeorgian, nameEnglish, nameRussian, region, isActive = true } = req.body;
    const cityRepository = AppDataSource.getRepository(City);
    
    // Check if city with this code already exists
    const existingCity = await cityRepository.findOne({ where: { code } });
    if (existingCity) {
      res.status(400).json({
        success: false,
        message: 'City with this code already exists'
      });
      return;
    }
    
    const city = new City();
    city.code = code;
    city.nameGeorgian = nameGeorgian;
    city.nameEnglish = nameEnglish;
    city.nameRussian = nameRussian;
    city.region = region;
    city.isActive = isActive;
    
    const savedCity = await cityRepository.save(city);
    
    res.status(201).json({
      success: true,
      message: 'City created successfully',
      data: savedCity
    });
  } catch (error) {
    console.error('Create city error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create city'
    });
  }
};

export const updateCity = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { code, nameGeorgian, nameEnglish, nameRussian, region, isActive } = req.body;
    const cityRepository = AppDataSource.getRepository(City);
    
    const city = await cityRepository.findOne({ where: { id: parseInt(id) } });
    if (!city) {
      res.status(404).json({
        success: false,
        message: 'City not found'
      });
      return;
    }
    
    // Check if new code conflicts with existing city
    if (code && code !== city.code) {
      const existingCity = await cityRepository.findOne({ where: { code } });
      if (existingCity) {
        res.status(400).json({
          success: false,
          message: 'City with this code already exists'
        });
        return;
      }
    }
    
    if (code !== undefined) city.code = code;
    if (nameGeorgian !== undefined) city.nameGeorgian = nameGeorgian;
    if (nameEnglish !== undefined) city.nameEnglish = nameEnglish;
    if (nameRussian !== undefined) city.nameRussian = nameRussian;
    if (region !== undefined) city.region = region;
    if (isActive !== undefined) city.isActive = isActive;
    
    const updatedCity = await cityRepository.save(city);
    
    res.status(200).json({
      success: true,
      message: 'City updated successfully',
      data: updatedCity
    });
  } catch (error) {
    console.error('Update city error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update city'
    });
  }
};

export const deleteCity = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const cityRepository = AppDataSource.getRepository(City);
    
    const city = await cityRepository.findOne({ 
      where: { id: parseInt(id) },
      relations: ['properties']
    });
    
    if (!city) {
      res.status(404).json({
        success: false,
        message: 'City not found'
      });
      return;
    }
    
    // Check if city has properties
    if (city.properties && city.properties.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete city that has properties. Please reassign properties to another city first.'
      });
      return;
    }
    
    await cityRepository.remove(city);
    
    res.status(200).json({
      success: true,
      message: 'City deleted successfully'
    });
  } catch (error) {
    console.error('Delete city error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete city'
    });
  }
};

export const searchCities = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query;
    const cityRepository = AppDataSource.getRepository(City);
    
    if (!q) {
      res.status(400).json({
        success: false,
        message: 'Search query (q) is required'
      });
      return;
    }
    
    const searchTerm = q.toString();
    const cities = await cityRepository.find({
      where: [
        { nameGeorgian: ILike(`%${searchTerm}%`) },
        { nameEnglish: ILike(`%${searchTerm}%`) },
        { nameRussian: ILike(`%${searchTerm}%`) },
        { code: ILike(`%${searchTerm.toLowerCase()}%`) }
      ],
      order: { nameGeorgian: 'ASC' },
      take: 10
    });
    
    res.status(200).json({
      success: true,
      data: cities
    });
  } catch (error) {
    console.error('Search cities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search cities'
    });
  }
};

