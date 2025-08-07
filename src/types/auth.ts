import { Request } from 'express';
import { IUser } from './user.js';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: 'user' | 'admin';
}

export interface LoginResponse {
  user: {
    id: number;
    fullName: string;
    email: string;
    role: 'user' | 'admin';
  };
  token: string;
  refreshToken?: string;
}