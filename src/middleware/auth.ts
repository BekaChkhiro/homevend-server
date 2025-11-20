import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js';
import { AppDataSource } from '../config/database.js';
import { User } from '../models/User.js';
import { AuthenticatedRequest } from '../types/auth.js';

export type { AuthenticatedRequest };

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('Auth middleware called for:', req.method, req.originalUrl);
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      console.log('No token provided');
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
      return;
    }

    // Mock token support for testing
    if (token === 'mock-agency-token') {
      console.log('Mock agency token detected');
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: 4 } // testagency@example.com user
      });
      
      if (user) {
        console.log('Mock user authenticated:', user.id, user.email, user.role);
        req.user = user;
        next();
        return;
      }
    }

    console.log('Token found, verifying...');
    const decoded = verifyToken(token);
    console.log('Token decoded, userId:', decoded.userId);
    
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: decoded.userId }
    });

    if (!user) {
      console.log('User not found for ID:', decoded.userId);
      res.status(401).json({
        success: false,
        message: 'Access denied. User not found.'
      });
      return;
    }

    console.log('User authenticated:', user.id, user.email, user.role);
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Access denied. Invalid token.'
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
      return;
    }

    next();
  };
};

// Admin-only authorization middleware
export const authorizeAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  console.log('[AUTHORIZE ADMIN] Checking admin access for:', req.method, req.originalUrl);
  console.log('[AUTHORIZE ADMIN] User:', req.user?.email, 'Role:', req.user?.role);

  if (!req.user) {
    console.log('[AUTHORIZE ADMIN] No user in request');
    res.status(401).json({
      success: false,
      message: 'Access denied. Authentication required.'
    });
    return;
  }

  if (req.user.role !== 'admin') {
    console.log('[AUTHORIZE ADMIN] Access denied - user is not admin');
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin permissions required.'
    });
    return;
  }

  console.log('[AUTHORIZE ADMIN] Admin access granted');
  next();
};