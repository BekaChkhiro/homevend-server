import { Response } from 'express';
import { Not } from 'typeorm';
import { AppDataSource } from '../config/database.js';
import { District } from '../models/District.js';
import { AuthenticatedRequest } from '../types/auth.js';

export const getAllDistricts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const districtRepository = AppDataSource.getRepository(District);
    
    const districts = await districtRepository.find({
      where: { isActive: true },
      order: { nameKa: 'ASC' }
    });
    
    res.status(200).json({
      success: true,
      data: districts
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
      where: { id: Number(id) }
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
    
    if (!nameKa || !nameEn || pricePerSqm === undefined) {
      res.status(400).json({
        success: false,
        message: 'Georgian name, English name, and price per square meter are required'
      });
      return;
    }
    
    const districtRepository = AppDataSource.getRepository(District);
    
    // Check if district with same name already exists
    const existingDistrict = await districtRepository.findOne({
      where: [
        { nameKa },
        { nameEn },
        { nameRu: nameRu || '' }
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
      nameRu: nameRu || nameEn,
      description,
      pricePerSqm: Number(pricePerSqm),
      isActive: true
    });
    
    await districtRepository.save(district);
    
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
    district.pricePerSqm = pricePerSqm !== undefined ? Number(pricePerSqm) : district.pricePerSqm;
    
    await districtRepository.save(district);
    
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