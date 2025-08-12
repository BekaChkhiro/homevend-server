import { Request } from 'express';
import { IUser } from './user.js';
import { UserRoleEnum } from '../models/User.js';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: UserRoleEnum;
}

export interface LoginResponse {
  user: {
    id: number;
    fullName: string;
    email: string;
    role: UserRoleEnum;
  };
  token: string;
  refreshToken?: string;
}