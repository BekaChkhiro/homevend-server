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
      .enum(['user', 'admin', 'agency', 'developer'])
      .optional()
      .default('user'),
    agencyData: z.object({
      name: z.string().min(2, 'Agency name must be at least 2 characters').max(300, 'Agency name cannot exceed 300 characters'),
      phone: z.string().min(7, 'Phone number must be at least 7 characters').max(20, 'Phone number cannot exceed 20 characters'),
      website: z.string().url('Invalid website URL').optional().or(z.literal('')),
      socialMediaUrl: z.string().url('Invalid social media URL').optional().or(z.literal(''))
    }).optional(),
    developerData: z.object({
      name: z.string().min(2, 'Developer name must be at least 2 characters').max(300, 'Developer name cannot exceed 300 characters'),
      phone: z.string().min(7, 'Phone number must be at least 7 characters').max(20, 'Phone number cannot exceed 20 characters'),
      website: z.string().url('Invalid website URL').optional().or(z.literal('')),
      socialMediaUrl: z.string().url('Invalid social media URL').optional().or(z.literal(''))
    }).optional()
  }).refine((data) => {
    // If role is agency, agencyData is required
    if (data.role === 'agency') {
      return data.agencyData !== undefined;
    }
    // If role is developer, developerData is required
    if (data.role === 'developer') {
      return data.developerData !== undefined;
    }
    // If role is not agency or developer, fullName is required
    return data.fullName !== undefined;
  }, {
    message: 'Agency registration requires agency data, developer registration requires developer data, regular registration requires full name'
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

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Please provide a valid email address')
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(255, 'Password cannot exceed 255 characters'),
    confirmPassword: z
      .string()
      .min(6, 'Password must be at least 6 characters')
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
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

export const projectSchema = z.object({
  body: z.object({
    projectName: z.string().min(1, 'Project name is required').max(300, 'Project name cannot exceed 300 characters'),
    description: z.string().optional(),
    cityId: z.number().min(1, 'City ID is required'),
    areaId: z.number().optional(),
    street: z.string().min(1, 'Street is required').max(200, 'Street cannot exceed 200 characters'),
    streetNumber: z.string().optional().refine(val => !val || val.length <= 20, 'Street number cannot exceed 20 characters'),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    projectType: z.enum(['private_house', 'apartment_building']),
    deliveryStatus: z.enum(['completed_with_renovation', 'green_frame', 'black_frame', 'white_frame']),
    deliveryDate: z.string().optional(),
    numberOfBuildings: z.number().min(1, 'Number of buildings must be at least 1'),
    totalApartments: z.number().min(1, 'Total apartments must be at least 1'),
    numberOfFloors: z.number().min(1, 'Number of floors must be at least 1'),
    parkingSpaces: z.number().optional(),
    
    // Amenities in project area
    hasGroceryStore: z.boolean().default(false),
    hasBikePath: z.boolean().default(false),
    hasSportsField: z.boolean().default(false),
    hasChildrenArea: z.boolean().default(false),
    hasSquare: z.boolean().default(false),
    
    // Within 300 meters
    pharmacy300m: z.boolean().default(false),
    kindergarten300m: z.boolean().default(false),
    school300m: z.boolean().default(false),
    busStop300m: z.boolean().default(false),
    groceryStore300m: z.boolean().default(false),
    bikePath300m: z.boolean().default(false),
    sportsField300m: z.boolean().default(false),
    stadium300m: z.boolean().default(false),
    square300m: z.boolean().default(false),
    
    // Within 500 meters
    pharmacy500m: z.boolean().default(false),
    kindergarten500m: z.boolean().default(false),
    school500m: z.boolean().default(false),
    university500m: z.boolean().default(false),
    busStop500m: z.boolean().default(false),
    groceryStore500m: z.boolean().default(false),
    bikePath500m: z.boolean().default(false),
    sportsField500m: z.boolean().default(false),
    stadium500m: z.boolean().default(false),
    square500m: z.boolean().default(false),
    
    // Within 1 kilometer
    hospital1km: z.boolean().default(false),
    
    // Post-handover services
    securityService: z.boolean().default(false),
    hasLobby: z.boolean().default(false),
    hasConcierge: z.boolean().default(false),
    videoSurveillance: z.boolean().default(false),
    hasLighting: z.boolean().default(false),
    landscaping: z.boolean().default(false),
    yardCleaning: z.boolean().default(false),
    entranceCleaning: z.boolean().default(false),
    hasDoorman: z.boolean().default(false),
    
    // Security
    fireSystem: z.boolean().default(false),
    mainDoorLock: z.boolean().default(false),
    
    // Pricing array
    pricing: z.array(z.object({
      roomType: z.enum(['studio', 'one_bedroom', 'two_bedroom', 'three_bedroom', 'four_bedroom', 'five_plus_bedroom']),
      numberOfRooms: z.number().min(1, 'Number of rooms must be at least 1'),
      totalArea: z.number().min(0.1, 'Total area must be greater than 0'),
      livingArea: z.number().optional(),
      balconyArea: z.number().optional(),
      pricePerSqm: z.number().min(0.01, 'Price per sqm must be greater than 0'),
      totalPriceFrom: z.number().min(0.01, 'Total price from must be greater than 0'),
      totalPriceTo: z.number().optional(),
      availableUnits: z.number().min(1, 'Available units must be at least 1').default(1),
      totalUnits: z.number().min(1, 'Total units must be at least 1').default(1),
      hasBalcony: z.boolean().default(false),
      hasTerrace: z.boolean().default(false),
      hasLoggia: z.boolean().default(false),
      floorFrom: z.number().optional(),
      floorTo: z.number().optional()
    })).optional()
  })
});