import { Request, Response } from 'express';
import crypto from 'crypto';
import { AppDataSource } from '../config/database.js';
import { User, UserRoleEnum } from '../models/User.js';
import { Agency } from '../models/Agency.js';
import { Developer } from '../models/Developer.js';
import { generateToken } from '../utils/jwt.js';
import { generateTokenPair, verifyRefreshToken, generateAccessToken, revokeRefreshToken } from '../utils/refreshToken.js';
import { LoginResponse } from '../types/auth.js';
import { AuthenticatedRequest } from '../types/auth.js';
import emailService from '../services/emailService.js';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔄 Registration request received for email:', req.body.email);
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
    const { fullName, email, password, role = UserRoleEnum.USER, agencyData, developerData } = req.body;

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
      
      // Handle fullName based on role
      if (role === UserRoleEnum.AGENCY && !fullName && agencyData?.name) {
        user.fullName = agencyData.name;
      } else if (role === UserRoleEnum.DEVELOPER && !fullName && developerData?.name) {
        user.fullName = developerData.name;
      } else if (fullName) {
        user.fullName = fullName;
      } else {
        // Fallback names based on role - no more "Agency User" default
        user.fullName = role === UserRoleEnum.AGENCY ? agencyData?.name || 'სააგენტო' : 
                       role === UserRoleEnum.DEVELOPER ? developerData?.name || 'დეველოპერი' : 'მომხმარებელი';
      }
      
      user.email = email;
      user.password = password;
      user.role = role;
      
      // Generate email verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      user.verificationToken = verificationToken;
      user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      user.emailVerified = false;
      
      // Add phone number if provided
      if (role === UserRoleEnum.AGENCY && agencyData?.phone) {
        user.phone = agencyData.phone;
      } else if (role === UserRoleEnum.DEVELOPER && developerData?.phone) {
        user.phone = developerData.phone;
      }

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

      // If registering as developer, create developer record
      let savedDeveloper = null;
      if (role === UserRoleEnum.DEVELOPER && developerData) {
        console.log('🏗️ Creating developer record for user:', savedUser.id);
        console.log('📊 Developer data:', developerData);

        const developer = new Developer();
        developer.ownerId = savedUser.id;
        developer.name = developerData.name;
        developer.phone = developerData.phone;
        developer.website = developerData.website || null;
        developer.socialMediaUrl = developerData.socialMediaUrl || null;
        developer.email = email; // Use same email as user

        savedDeveloper = await manager.save(Developer, developer);
        console.log('✅ Developer saved with ID:', savedDeveloper.id);
      }

      return { savedUser, savedAgency, savedDeveloper };
    });

    console.log('✅ User saved to database with verification token:', result.savedUser.verificationToken);

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
        phoneNumber: result.savedUser.phone,
        ...(result.savedAgency && { agencyId: result.savedAgency.id }),
        ...(result.savedDeveloper && { developerId: result.savedDeveloper.id })
      },
      token: accessToken,
      refreshToken
    };

    // Send verification email
    try {
      console.log('🔄 Attempting to send verification email to:', result.savedUser.email);
      console.log('🔑 Verification token:', result.savedUser.verificationToken);
      
      await emailService.sendVerificationEmail(
        result.savedUser.email,
        result.savedUser.verificationToken!,
        result.savedUser.fullName
      );
      
      console.log('✅ Verification email sent successfully');
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError);
      console.error('Email error details:', emailError);
      // Continue with registration even if email fails
    }

    const message = role === UserRoleEnum.AGENCY 
      ? 'Agency registered successfully. Please check your email to verify your account.'
      : role === UserRoleEnum.DEVELOPER
      ? 'Developer registered successfully. Please check your email to verify your account.'
      : 'User registered successfully. Please check your email to verify your account.';

    res.status(201).json({
      success: true,
      message,
      data: response
    });
  } catch (error: any) {
    console.error('❌ Registration error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', JSON.stringify(error, null, 2));

    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
        role: user.role,
        phoneNumber: user.phone
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
        phoneNumber: user.phone,
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

// Email verification functions
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: {
        verificationToken: token
      }
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
      return;
    }

    // Check if token is expired
    if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
      res.status(400).json({
        success: false,
        message: 'Verification token has expired'
      });
      return;
    }

    // Mark email as verified
    user.emailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await userRepository.save(user);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify email'
    });
  }
};

export const resendVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if user exists or not for security
      res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a verification link has been sent'
      });
      return;
    }

    if (user.emailVerified) {
      res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
      return;
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await userRepository.save(user);

    // Send verification email
    try {
      await emailService.sendVerificationEmail(user.email, verificationToken, user.fullName);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send verification email'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email'
    });
  }
};

// Password reset functions
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  console.log('=== FORGOT PASSWORD CONTROLLER HIT ===');
  console.log('Request body:', req.body);
  try {
    console.log('🔄 Forgot password request for email:', req.body.email);
    const { email } = req.body;
    
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email } });
    
    console.log('🔍 User found:', user ? 'Yes' : 'No');

    if (!user) {
      // Don't reveal if user exists or not for security
      res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent'
      });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await userRepository.save(user);
    
    console.log('🔑 Reset token generated:', resetToken);

    // Send reset email
    try {
      console.log('📧 Attempting to send password reset email...');
      await emailService.sendPasswordResetEmail(user.email, resetToken, user.fullName);
      console.log('✅ Password reset email sent successfully');
    } catch (emailError) {
      console.error('❌ Failed to send password reset email:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send password reset email'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully'
    });
  } catch (error) {
    console.error('=== FORGOT PASSWORD ERROR ===');
    console.error('Forgot password error:', error);
    console.error('Error stack:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request'
    });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: {
        resetPasswordToken: token
      }
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
      return;
    }

    // Check if token is expired
    if (user.resetPasswordExpires && user.resetPasswordExpires < new Date()) {
      res.status(400).json({
        success: false,
        message: 'Password reset token has expired'
      });
      return;
    }

    // Update password
    user.password = password; // Will be hashed by @BeforeInsert/@BeforeUpdate hook
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await userRepository.save(user);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
};

export const validateResetToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: {
        resetPasswordToken: token
      }
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid reset token'
      });
      return;
    }

    // Check if token is expired
    if (user.resetPasswordExpires && user.resetPasswordExpires < new Date()) {
      res.status(400).json({
        success: false,
        message: 'Password reset token has expired'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        email: user.email
      }
    });
  } catch (error) {
    console.error('Validate reset token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate reset token'
    });
  }
};

