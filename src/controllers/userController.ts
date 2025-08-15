import { Request, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { User, UserRoleEnum } from '../models/User.js';
import { Property } from '../models/Property.js';
import { Agency } from '../models/Agency.js';
import { AuthenticatedRequest } from '../types/auth.js';

// Get user by ID with agency information
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userRepository = AppDataSource.getRepository(User);
    const agencyRepository = AppDataSource.getRepository(Agency);

    const user = await userRepository.findOne({
      where: { id: parseInt(id) },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        agencyId: true
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    let userWithAgency: any = { ...user };

    // If user belongs to an agency, fetch agency details
    if (user.agencyId) {
      const agency = await agencyRepository.findOne({
        where: { id: user.agencyId },
        select: {
          id: true,
          name: true,
          logoUrl: true
        }
      });

      if (agency) {
        userWithAgency.agency = agency;
      }
    }

    res.status(200).json({
      success: true,
      data: userWithAgency
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
};

// Get properties by user ID (public endpoint for viewing any user's properties)
export const getPropertiesByUserId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const propertyRepository = AppDataSource.getRepository(Property);

    const properties = await propertyRepository.find({
      where: { 
        userId: parseInt(userId)
      },
      relations: ['city', 'areaData', 'photos'],
      order: { createdAt: 'DESC' }
    });

    // Transform properties to include photo URLs and rename area relationship
    const transformedProperties = properties.map(property => {
      const photos = property.photos ? 
        property.photos
          .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0)) // Primary photo first
          .map(photo => photo.filePath) 
        : [];

      return {
        ...property,
        areaLocation: property.areaData, // Rename areaData relationship to areaLocation
        photos
      };
    });

    res.status(200).json({
      success: true,
      data: transformedProperties
    });
  } catch (error) {
    console.error('Get user properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user properties'
    });
  }
};

// Get all users (for admin purposes or public listing)
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const userRepository = AppDataSource.getRepository(User);

    const where: any = {};
    
    if (role && role !== 'all') {
      where.role = role;
    }
    
    if (search) {
      where.fullName = { $ilike: `%${search}%` };
    }

    const [users, total] = await userRepository.findAndCount({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
        agencyId: true
      },
      order: { createdAt: 'DESC' },
      take: parseInt(limit as string),
      skip: (parseInt(page as string) - 1) * parseInt(limit as string)
    });

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

// Update user profile (for authenticated user updating their own profile)
export const updateUserProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { fullName, phone } = req.body;
    const userId = req.user!.id;
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Update allowed fields
    if (fullName !== undefined) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;

    const updatedUser = await userRepository.save(user);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};