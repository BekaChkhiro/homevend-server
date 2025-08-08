import { Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { Property } from '../models/Property.js';
import { AuthenticatedRequest } from '../types/auth.js';
import { FindManyOptions, Like, In } from 'typeorm';

export const createProperty = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const propertyRepository = AppDataSource.getRepository(Property);
    
    const property = new Property();
    Object.assign(property, req.body);
    property.userId = req.user!.id;
    
    await propertyRepository.save(property);
    
    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: property
    });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create property'
    });
  }
};

export const getProperties = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      city,
      propertyType,
      dealType,
      minPrice,
      maxPrice
    } = req.query;
    
    const propertyRepository = AppDataSource.getRepository(Property);
    
    const where: any = {};
    if (city) where.city = Like(`%${city}%`);
    if (propertyType) where.propertyType = propertyType;
    if (dealType) where.dealType = dealType;
    
    const options: FindManyOptions<Property> = {
      where,
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
      order: { createdAt: 'DESC' },
      relations: ['user']
    };
    
    const [properties, total] = await propertyRepository.findAndCount(options);
    
    res.status(200).json({
      success: true,
      data: {
        properties: properties.map(p => ({
          ...p,
          user: { id: p.user.id, fullName: p.user.fullName, email: p.user.email }
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
    console.error('Get properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch properties'
    });
  }
};

export const getPropertyById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const propertyId = parseInt(id);
    
    if (!propertyId || isNaN(propertyId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid property ID'
      });
      return;
    }
    
    const propertyRepository = AppDataSource.getRepository(Property);
    
    const property = await propertyRepository.findOne({
      where: { id: propertyId },
      relations: ['user']
    });
    
    if (!property) {
      res.status(404).json({
        success: false,
        message: 'Property not found'
      });
      return;
    }
    
    await propertyRepository.increment({ id: propertyId }, 'viewCount', 1);
    
    res.status(200).json({
      success: true,
      data: {
        ...property,
        user: { id: property.user.id, fullName: property.user.fullName, email: property.user.email }
      }
    });
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch property'
    });
  }
};

export const getUserProperties = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const propertyRepository = AppDataSource.getRepository(Property);
    
    const properties = await propertyRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });
    
    res.status(200).json({
      success: true,
      data: properties
    });
  } catch (error) {
    console.error('Get user properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user properties'
    });
  }
};

export const updateProperty = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const propertyRepository = AppDataSource.getRepository(Property);
    
    const property = await propertyRepository.findOne({
      where: { id }
    });
    
    if (!property) {
      res.status(404).json({
        success: false,
        message: 'Property not found'
      });
      return;
    }
    
    if (property.userId !== req.user!.id && req.user!.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Not authorized to update this property'
      });
      return;
    }
    
    Object.assign(property, req.body);
    await propertyRepository.save(property);
    
    res.status(200).json({
      success: true,
      message: 'Property updated successfully',
      data: property
    });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update property'
    });
  }
};

export const deleteProperty = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const propertyRepository = AppDataSource.getRepository(Property);
    
    const property = await propertyRepository.findOne({
      where: { id }
    });
    
    if (!property) {
      res.status(404).json({
        success: false,
        message: 'Property not found'
      });
      return;
    }
    
    if (property.userId !== req.user!.id && req.user!.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Not authorized to delete this property'
      });
      return;
    }
    
    await propertyRepository.remove(property);
    
    res.status(200).json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete property'
    });
  }
};

