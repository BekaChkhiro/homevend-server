import { Request, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { User, UserRoleEnum } from '../models/User.js';
import { Agency } from '../models/Agency.js';
import { generateToken } from '../utils/jwt.js';
import { generateTokenPair, verifyRefreshToken, generateAccessToken, revokeRefreshToken } from '../utils/refreshToken.js';
import { LoginResponse } from '../types/auth.js';
import { AuthenticatedRequest } from '../types/auth.js';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, password, role = UserRoleEnum.USER, agencyData } = req.body;

    const userRepository = AppDataSource.getRepository(User);
    const agencyRepository = AppDataSource.getRepository(Agency);

    // Check if user already exists
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
      return;
    }

    // Use transaction for agency registration
    const result = await AppDataSource.manager.transaction(async manager => {
      // Create new user
      const user = new User();
      // For agency registration, use agency name as fullName if fullName is not provided
      if (role === UserRoleEnum.AGENCY && !fullName && agencyData?.name) {
        user.fullName = agencyData.name;
      } else {
        user.fullName = fullName || 'Agency User';
      }
      user.email = email;
      user.password = password;
      user.role = role;

      const savedUser = await manager.save(User, user);

      // If registering as agency, create agency record
      let savedAgency = null;
      if (role === UserRoleEnum.AGENCY && agencyData) {
        const agency = new Agency();
        agency.ownerId = savedUser.id;
        agency.name = agencyData.name;
        agency.phone = agencyData.phone;
        agency.website = agencyData.website || null;
        agency.socialMediaUrl = agencyData.socialMediaUrl || null;
        agency.email = email; // Use same email as user

        savedAgency = await manager.save(Agency, agency);
      }

      return { savedUser, savedAgency };
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair({
      userId: result.savedUser.id,
      email: result.savedUser.email,
      role: result.savedUser.role
    });

    const response: LoginResponse = {
      user: {
        id: result.savedUser.id,
        fullName: result.savedUser.fullName,
        email: result.savedUser.email,
        role: result.savedUser.role,
        ...(result.savedAgency && { agencyId: result.savedAgency.id })
      },
      token: accessToken,
      refreshToken
    };

    const message = role === UserRoleEnum.AGENCY 
      ? 'Agency registered successfully'
      : 'User registered successfully';

    res.status(201).json({
      success: true,
      message,
      data: response
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const userRepository = AppDataSource.getRepository(User);

    // Find user by email
    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    const response: LoginResponse = {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      },
      token: accessToken,
      refreshToken
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: response
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, refreshToken } = req.body;
    
    if (!userId || !refreshToken) {
      res.status(400).json({
        success: false,
        message: 'User ID and refresh token are required'
      });
      return;
    }
    
    if (!verifyRefreshToken(userId, refreshToken)) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
      return;
    }
    
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
    
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });
    
    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: { accessToken }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh token'
    });
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    revokeRefreshToken(userId);
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to logout'
    });
  }
};