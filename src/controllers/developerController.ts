import { Request, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { Developer } from '../models/Developer.js';
import { User, UserRoleEnum } from '../models/User.js';
import { Property } from '../models/Property.js';
import { Project } from '../models/Project.js';
import { AuthenticatedRequest } from '../types/auth.js';
import { FindManyOptions, ILike } from 'typeorm';

// Get all developers
export const getDevelopers = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      city,
      isVerified
    } = req.query;
    
    const userRepository = AppDataSource.getRepository(User);

    let queryBuilder = userRepository.createQueryBuilder('user')
      .where('user.role = :role', { role: 'developer' });
    
    if (search) {
      queryBuilder = queryBuilder.andWhere('user.fullName ILIKE :search', { search: `%${search}%` });
    }

    queryBuilder = queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip((Number(page) - 1) * Number(limit))
      .take(Number(limit))
      .select([
        'user.id',
        'user.uuid', 
        'user.fullName',
        'user.email',
        'user.phone',
        'user.createdAt'
      ]);

    const [developers, total] = await queryBuilder.getManyAndCount();
    
    // Get actual counts for each developer
    const projectRepository = AppDataSource.getRepository(Project);
    const propertyRepository = AppDataSource.getRepository(Property);
    
    const transformedDevelopers = await Promise.all(developers.map(async (user) => {
      // Count projects for this developer
      const projectCount = await projectRepository.count({
        where: { developerId: user.id, isActive: true }
      });
      
      // Count properties for this developer (by user ID since they're the same)
      const propertyCount = await propertyRepository.count({
        where: { userId: user.id }
      });
      
      return {
        id: user.id,
        uuid: user.uuid,
        name: user.fullName,
        description: null,
        logoUrl: null,
        phone: user.phone,
        email: user.email,
        website: null,
        socialMediaUrl: null,
        address: null,
        isVerified: false,
        projectCount,
        propertyCount,
        totalSales: 0,
        createdAt: user.createdAt,
        owner: {
          id: user.id,
          fullName: user.fullName,
          email: user.email
        }
      };
    }));
    
    res.status(200).json({
      success: true,
      data: {
        developers: transformedDevelopers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get developers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch developers'
    });
  }
};

// Get developer by ID (supports both numeric ID and UUID)
export const getDeveloperById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userRepository = AppDataSource.getRepository(User);
    const projectRepository = AppDataSource.getRepository(Project);
    const propertyRepository = AppDataSource.getRepository(Property);
    
    // Check if the ID is numeric or UUID
    const isNumericId = /^\d+$/.test(id);
    
    let queryBuilder = userRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: 'developer' });
    
    if (isNumericId) {
      queryBuilder = queryBuilder.andWhere('user.id = :id', { id: parseInt(id) });
    } else {
      queryBuilder = queryBuilder.andWhere('user.uuid = :uuid', { uuid: id });
    }
    
    const user = await queryBuilder.getOne();
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Developer not found'
      });
      return;
    }
    
    // Get actual counts for this developer
    const projectCount = await projectRepository.count({
      where: { developerId: user.id, isActive: true }
    });
    
    const propertyCount = await propertyRepository.count({
      where: { userId: user.id }
    });

    // Transform user to developer format
    const developer = {
      id: user.id,
      uuid: user.uuid,
      name: user.fullName,
      description: null,
      logoUrl: null,
      bannerUrl: null,
      phone: user.phone,
      email: user.email,
      website: null,
      socialMediaUrl: null,
      address: null,
      taxNumber: null,
      registrationNumber: null,
      isVerified: false,
      projectCount,
      propertyCount,
      totalSales: 0,
      createdAt: user.createdAt,
      owner: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    };
    
    // Fetch developer's projects
    const projects = await projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.city', 'city')
      .leftJoinAndSelect('project.areaData', 'area')
      .where('project.developerId = :developerId AND project.isActive = :isActive', { 
        developerId: user.id, 
        isActive: true 
      })
      .orderBy('project.createdAt', 'DESC')
      .getMany();

    // Fetch developer's properties (if developer_id column exists)
    const properties = await propertyRepository
      .createQueryBuilder('property')
      .leftJoinAndSelect('property.city', 'city')
      .leftJoinAndSelect('property.areaData', 'area')
      .where('property.userId = :userId', { userId: user.id })
      .orderBy('property.createdAt', 'DESC')
      .take(20)
      .getMany();
    
    res.status(200).json({
      success: true,
      data: {
        ...developer,
        projects,
        properties
      }
    });
  } catch (error) {
    console.error('Get developer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch developer'
    });
  }
};

// Create developer (when user registers as developer)
export const createDeveloper = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const {
      name,
      description,
      website,
      socialMediaUrl,
      phone,
      email,
      address,
      taxNumber,
      registrationNumber,
      logoUrl,
      bannerUrl
    } = req.body;

    const developerRepository = AppDataSource.getRepository(Developer);
    const userRepository = AppDataSource.getRepository(User);

    // Check if user exists and has developer role
    const user = await userRepository.findOne({
      where: { id: userId, role: UserRoleEnum.DEVELOPER }
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'User not found or not a developer'
      });
      return;
    }

    // Check if developer already exists for this user
    const existingDeveloper = await developerRepository.findOne({
      where: { ownerId: userId }
    });

    if (existingDeveloper) {
      res.status(400).json({
        success: false,
        message: 'Developer profile already exists for this user'
      });
      return;
    }

    const developer = developerRepository.create({
      ownerId: userId,
      name,
      description,
      website,
      socialMediaUrl,
      phone,
      email,
      address,
      taxNumber,
      registrationNumber,
      logoUrl,
      bannerUrl
    });

    await developerRepository.save(developer);

    res.status(201).json({
      success: true,
      data: developer,
      message: 'Developer created successfully'
    });
  } catch (error) {
    console.error('Create developer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create developer'
    });
  }
};

// Update developer
export const updateDeveloper = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const developerRepository = AppDataSource.getRepository(Developer);
    const userRepository = AppDataSource.getRepository(User);

    // First, try to find existing developer by user ID (more reliable)
    let developer = await developerRepository.findOne({
      where: { ownerId: userId },
      relations: ['owner']
    });

    // If no developer found by user ID, try by the provided ID (but verify ownership)
    if (!developer && id && id !== '1' && !isNaN(parseInt(id))) {
      const developerById = await developerRepository.findOne({
        where: { id: parseInt(id) },
        relations: ['owner']
      });

      if (developerById && developerById.ownerId === userId) {
        developer = developerById;
      }
    }

    // If still no developer found, create one
    if (!developer) {
      const user = await userRepository.findOne({
        where: { id: userId, role: UserRoleEnum.DEVELOPER }
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found or not a developer'
        });
        return;
      }

      // Create a developer record
      developer = developerRepository.create({
        ownerId: userId,
        name: user.fullName || 'Developer Company',
        phone: user.phone,
        email: user.email,
        description: null,
        website: null,
        socialMediaUrl: null,
        address: null,
        taxNumber: null,
        registrationNumber: null,
        logoUrl: null,
        bannerUrl: null
      });

      developer = await developerRepository.save(developer);
    }

    const updateData = { ...req.body };
    delete updateData.id;
    delete updateData.uuid;
    delete updateData.ownerId;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    await developerRepository.update(developer.id, updateData);

    const updatedDeveloper = await developerRepository.findOne({
      where: { id: developer.id },
      relations: ['owner']
    });

    res.status(200).json({
      success: true,
      data: updatedDeveloper,
      message: 'Developer updated successfully'
    });
  } catch (error) {
    console.error('Update developer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update developer'
    });
  }
};

// Get my developer profile
export const getMyDeveloper = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const developerRepository = AppDataSource.getRepository(Developer);
    const userRepository = AppDataSource.getRepository(User);
    // First, check if there's a developer record
    let developer = await developerRepository.findOne({
      where: { ownerId: userId },
      relations: ['owner']
    });

    // If no developer record exists, create one from user data
    if (!developer) {
      const user = await userRepository.findOne({
        where: { id: userId, role: UserRoleEnum.DEVELOPER }
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found or not a developer'
        });
        return;
      }

      // Create a developer record with user's basic information
      developer = developerRepository.create({
        ownerId: userId,
        name: user.fullName || 'Developer Company',
        phone: user.phone,
        email: user.email,
        description: null,
        website: null,
        socialMediaUrl: null,
        address: null,
        taxNumber: null,
        registrationNumber: null,
        logoUrl: null,
        bannerUrl: null
      });

      developer = await developerRepository.save(developer);

      // Load the developer with owner relation
      developer = await developerRepository.findOne({
        where: { id: developer.id },
        relations: ['owner']

      });
    }

    // Try to find existing developer record
    let developer = await developerRepository.findOne({
      where: { ownerId: userId },
      relations: ['owner']
    });

    // If no developer record exists, create one based on user data
    if (!developer) {
      developer = developerRepository.create({
        ownerId: userId,
        name: user.fullName || 'Developer Company',
        phone: user.phone || '',
        email: user.email,
        website: '',
        socialMediaUrl: '',
        description: ''
      });
      
      await developerRepository.save(developer);
      
      // Fetch the saved developer with relations
      developer = await developerRepository.findOne({
        where: { ownerId: userId },
        relations: ['owner']
      });
    }

    res.status(200).json({
      success: true,
      data: developer
    });
  } catch (error) {
    console.error('Get my developer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch developer profile'
    });
  }
};