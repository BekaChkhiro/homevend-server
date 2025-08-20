import { Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { User } from '../models/User.js';
import { Property } from '../models/Property.js';
import { AuthenticatedRequest } from '../types/auth.js';

export const getAllUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, role } = req.query;
    
    const userRepository = AppDataSource.getRepository(User);
    
    const where: any = {};
    if (role) where.role = role;
    
    const [users, total] = await userRepository.findAndCount({
      where,
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
      order: { createdAt: 'DESC' },
      select: ['id', 'fullName', 'email', 'role', 'createdAt', 'updatedAt']
    });
    
    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
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

export const getUserById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userRepository = AppDataSource.getRepository(User);
    const propertyRepository = AppDataSource.getRepository(Property);
    
    const user = await userRepository.findOne({
      where: { id },
      select: ['id', 'fullName', 'email', 'role', 'createdAt', 'updatedAt']
    });
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    const propertyCount = await propertyRepository.count({
      where: { userId: id }
    });
    
    res.status(200).json({
      success: true,
      data: {
        ...user,
        propertyCount
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
};

export const updateUserRole = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
      return;
    }
    
    const userRepository = AppDataSource.getRepository(User);
    
    const user = await userRepository.findOne({
      where: { id }
    });
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    if (user.id === req.user!.id) {
      res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
      return;
    }
    
    user.role = role;
    await userRepository.save(user);
    
    res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role'
    });
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userRepository = AppDataSource.getRepository(User);
    
    const user = await userRepository.findOne({
      where: { id }
    });
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    if (user.id === req.user!.id) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
      return;
    }
    
    await userRepository.remove(user);
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const propertyRepository = AppDataSource.getRepository(Property);
    
    const [
      totalUsers,
      totalAdmins,
      totalProperties,
      pendingProperties,
      activeProperties
    ] = await Promise.all([
      userRepository.count({ where: { role: 'user' } }),
      userRepository.count({ where: { role: 'admin' } }),
      propertyRepository.count(),
      propertyRepository.count({ where: { status: 'pending' } }),
      propertyRepository.count({ where: { status: 'active' } })
    ]);
    
    const recentUsers = await userRepository.find({
      take: 5,
      order: { createdAt: 'DESC' },
      select: ['id', 'fullName', 'email', 'createdAt']
    });
    
    const recentProperties = await propertyRepository.find({
      take: 5,
      order: { createdAt: 'DESC' },
      relations: ['user'],
      select: ['id', 'propertyType', 'city', 'totalPrice', 'status', 'createdAt']
    });
    
    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalAdmins,
          totalProperties,
          pendingProperties,
          activeProperties
        },
        recentUsers,
        recentProperties: recentProperties.map(p => ({
          ...p,
          user: { id: p.user.id, fullName: p.user.fullName }
        }))
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
};