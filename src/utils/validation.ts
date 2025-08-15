import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name cannot exceed 100 characters')
      .optional(),
    email: z
      .string()
      .email('Please provide a valid email address')
      .max(255, 'Email cannot exceed 255 characters'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(255, 'Password cannot exceed 255 characters'),
    role: z
      .enum(['user', 'admin', 'agency'])
      .optional()
      .default('user'),
    agencyData: z.object({
      name: z.string().min(2, 'Agency name must be at least 2 characters').max(300, 'Agency name cannot exceed 300 characters'),
      phone: z.string().min(7, 'Phone number must be at least 7 characters').max(20, 'Phone number cannot exceed 20 characters'),
      website: z.string().url('Invalid website URL').optional().or(z.literal('')),
      socialMediaUrl: z.string().url('Invalid social media URL').optional().or(z.literal(''))
    }).optional()
  }).refine((data) => {
    // If role is agency, agencyData is required
    if (data.role === 'agency') {
      return data.agencyData !== undefined;
    }
    // If role is not agency, fullName is required
    return data.fullName !== undefined;
  }, {
    message: 'Agency registration requires agency data, regular registration requires full name'
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
    title: z.string().min(1, 'Title is required'),
    propertyType: z.string().min(1, 'Property type is required'),
    dealType: z.string().min(1, 'Deal type is required'),
    cityId: z.number().min(1, 'City ID is required'),
    areaId: z.number().optional(),
    street: z.string().min(1, 'Street is required'),
    streetNumber: z.string().optional(),
    cadastralCode: z.string().optional(),
    rooms: z.number().optional(),
    bedrooms: z.number().optional(),
    bathrooms: z.number().optional(),
    totalFloors: z.number().optional(),
    buildingStatus: z.string().optional(),
    constructionYear: z.enum(['before-1955', '1955-2000', 'after-2000']).optional(),
    condition: z.string().optional(),
    projectType: z.string().optional(),
    ceilingHeight: z.number().optional(),
    heating: z.string().optional(),
    parking: z.string().optional(),
    hotWater: z.string().optional(),
    buildingMaterial: z.string().optional(),
    hasBalcony: z.boolean().default(false),
    balconyCount: z.number().optional(),
    balconyArea: z.number().optional(),
    hasPool: z.boolean().default(false),
    poolType: z.string().optional(),
    hasLivingRoom: z.boolean().default(false),
    livingRoomArea: z.number().optional(),
    livingRoomType: z.string().optional(),
    hasLoggia: z.boolean().default(false),
    loggiaArea: z.number().optional(),
    hasVeranda: z.boolean().default(false),
    verandaArea: z.number().optional(),
    hasYard: z.boolean().default(false),
    yardArea: z.number().optional(),
    hasStorage: z.boolean().default(false),
    storageArea: z.number().optional(),
    storageType: z.string().optional(),
    features: z.array(z.string()).default([]),
    advantages: z.array(z.string()).default([]),
    furnitureAppliances: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    area: z.number().min(0.1, 'Area is required'),
    totalPrice: z.number().min(0.01, 'Total price is required'),
    pricePerSqm: z.number().optional(),
    contactName: z.string().min(1, 'Contact name is required'),
    contactPhone: z.string().min(1, 'Contact phone is required'),
    descriptionGeorgian: z.string().optional(),
    descriptionEnglish: z.string().optional(),
    descriptionRussian: z.string().optional()
  })
});