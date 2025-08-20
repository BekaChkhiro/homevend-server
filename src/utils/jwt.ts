import jwt, { SignOptions } from 'jsonwebtoken';
import { JWTPayload } from '../types/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'homevend-super-secret-jwt-key-development-only';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const generateToken = (payload: JWTPayload): string => {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as any,
    issuer: 'homevend-api',
    audience: 'homevend-client'
  };
  
  return jwt.sign(payload as any, JWT_SECRET, options);
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'homevend-api',
      audience: 'homevend-client'
    }) as JWTPayload;
    
    return decoded;
  } catch (error: any) {
    throw new Error('Invalid or expired token');
  }
};

export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7);
};