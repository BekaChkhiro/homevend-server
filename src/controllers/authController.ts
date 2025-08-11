import { Request, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { User, UserRoleEnum } from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { generateTokenPair, verifyRefreshToken, generateAccessToken, revokeRefreshToken } from '../utils/refreshToken.js';
import { LoginResponse } from '../types/auth.js';
import { AuthenticatedRequest } from '../types/auth.js';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, password, role = UserRoleEnum.USER } = req.body;

    const userRepository = AppDataSource.getRepository(User);

    // Check if user already exists
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
      return;
    }

    // Create new user
    const user = new User();
    user.fullName = fullName;
    user.email = email;
    user.password = password;
    user.role = role;

    const savedUser = await userRepository.save(user);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair({
      userId: savedUser.id,
      email: savedUser.email,
      role: savedUser.role
    });

    const response: LoginResponse = {
      user: {
        id: savedUser.id,
        fullName: savedUser.fullName,
        email: savedUser.email,
        role: savedUser.role
      },
      token: accessToken,
      refreshToken
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
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