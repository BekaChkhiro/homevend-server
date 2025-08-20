import { UserRoleEnum } from '../models/User';

export interface IUser {
  id: number;
  uuid: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role: UserRoleEnum;
  isVerified: boolean;
  isActive: boolean;
  profileImageUrl?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface CreateUserInput {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRoleEnum;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UserResponse {
  id: number;
  uuid: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRoleEnum;
  isVerified: boolean;
  isActive: boolean;
  profileImageUrl?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateUserInput {
  fullName?: string;
  phone?: string;
  profileImageUrl?: string;
}