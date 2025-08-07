import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name cannot exceed 100 characters'),
    email: z
      .string()
      .email('Please provide a valid email address')
      .max(255, 'Email cannot exceed 255 characters'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(255, 'Password cannot exceed 255 characters'),
    role: z
      .enum(['user', 'admin'])
      .optional()
      .default('user')
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Please provide a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
  })
});

export const propertySchema = z.object({
  body: z.object({
    propertyType: z.string().min(1, 'Property type is required'),
    dealType: z.string().min(1, 'Deal type is required'),
    city: z.string().min(1, 'City is required'),
    street: z.string().min(1, 'Street is required'),
    streetNumber: z.string().optional(),
    cadastralCode: z.string().optional(),
    rooms: z.string().optional(),
    bedrooms: z.string().optional(),
    bathrooms: z.string().optional(),
    totalFloors: z.string().optional(),
    buildingStatus: z.string().optional(),
    constructionYear: z.string().optional(),
    condition: z.string().optional(),
    projectType: z.string().optional(),
    ceilingHeight: z.string().optional(),
    heating: z.string().optional(),
    parking: z.string().optional(),
    hotWater: z.string().optional(),
    buildingMaterial: z.string().optional(),
    hasBalcony: z.boolean().default(false),
    balconyCount: z.string().optional(),
    balconyArea: z.string().optional(),
    hasPool: z.boolean().default(false),
    poolType: z.string().optional(),
    hasLivingRoom: z.boolean().default(false),
    livingRoomArea: z.string().optional(),
    livingRoomType: z.string().optional(),
    hasLoggia: z.boolean().default(false),
    loggiaArea: z.string().optional(),
    hasVeranda: z.boolean().default(false),
    verandaArea: z.string().optional(),
    hasYard: z.boolean().default(false),
    yardArea: z.string().optional(),
    hasStorage: z.boolean().default(false),
    storageArea: z.string().optional(),
    storageType: z.string().optional(),
    features: z.array(z.string()).default([]),
    advantages: z.array(z.string()).default([]),
    furnitureAppliances: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    area: z.string().min(1, 'Area is required'),
    totalPrice: z.string().min(1, 'Total price is required'),
    pricePerSqm: z.string().optional(),
    contactName: z.string().min(1, 'Contact name is required'),
    contactPhone: z.string().min(1, 'Contact phone is required'),
    descriptionGeorgian: z.string().optional(),
    descriptionEnglish: z.string().optional(),
    descriptionRussian: z.string().optional()
  })
});