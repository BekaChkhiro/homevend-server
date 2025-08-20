import jwt from 'jsonwebtoken';
import crypto from 'crypto';

interface RefreshTokenStore {
  [userId: number]: {
    token: string;
    expiresAt: Date;
  };
}

const refreshTokenStore: RefreshTokenStore = {};

export const generateRefreshToken = (userId: number): string => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  
  refreshTokenStore[userId] = {
    token,
    expiresAt
  };
  
  return token;
};

export const verifyRefreshToken = (userId: number, token: string): boolean => {
  const stored = refreshTokenStore[userId];
  
  if (!stored) return false;
  if (stored.token !== token) return false;
  if (stored.expiresAt < new Date()) {
    delete refreshTokenStore[userId];
    return false;
  }
  
  return true;
};

export const revokeRefreshToken = (userId: number): void => {
  delete refreshTokenStore[userId];
};

export const generateAccessToken = (payload: any): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '15m',
    issuer: 'homevend-api',
    audience: 'homevend-client'
  });
};

export const generateTokenPair = (payload: any) => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload.userId);
  
  return {
    accessToken,
    refreshToken
  };
};

setInterval(() => {
  const now = new Date();
  Object.keys(refreshTokenStore).forEach(userId => {
    if (refreshTokenStore[userId].expiresAt < now) {
      delete refreshTokenStore[userId];
    }
  });
}, 60 * 60 * 1000);