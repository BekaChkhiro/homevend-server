import { 
  PropertyTypeEnum, 
  DealTypeEnum, 
  BuildingStatusEnum, 
  ConstructionYearEnum, 
  ConditionEnum 
} from '../models/Property.js';

export interface ICity {
  id: number;
  code: string;
  nameGeorgian: string;
  nameEnglish?: string;
  region?: string;
}

export interface IFeature {
  id: number;
  code: string;
  nameGeorgian: string;
  nameEnglish?: string;
  iconName?: string;
  category?: string;
}

export interface IAdvantage {
  id: number;
  code: string;
  nameGeorgian: string;
  nameEnglish?: string;
  iconName?: string;
  category?: string;
}

export interface IFurnitureAppliance {
  id: number;
  code: string;
  nameGeorgian: string;
  nameEnglish?: string;
  category?: string;
}

export interface ITag {
  id: number;
  code: string;
  nameGeorgian: string;
  nameEnglish?: string;
  iconName?: string;
  color?: string;
}

export interface IPropertyPhoto {
  id: number;
  fileName: string;
  originalName?: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  altText?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface IProperty {
  id: number;
  uuid: string;
  userId: number;
  
  // Basic Information
  title: string;
  propertyType: PropertyTypeEnum;
  dealType: DealTypeEnum;
  dailyRentalSubcategory?: string;
  
  // Location
  cityId: number;
  city: ICity;
  district?: string;
  street: string;
  streetNumber?: string;
  postalCode?: string;
  cadastralCode?: string;
  latitude?: number;
  longitude?: number;

  // Property Details
  rooms?: string;
  bedrooms?: string;
  bathrooms?: string;
  totalFloors?: string;
  propertyFloor?: string;
  buildingStatus?: BuildingStatusEnum;
  constructionYear?: ConstructionYearEnum;
  condition?: ConditionEnum;
  projectType?: string;
  ceilingHeight?: number;
  
  // Infrastructure
  heating?: string;
  parking?: string;
  hotWater?: string;
  buildingMaterial?: string;

  // Conditional Features
  hasBalcony: boolean;
  balconyCount?: number;
  balconyArea?: number;
  
  hasPool: boolean;
  poolType?: string;
  
  hasLivingRoom: boolean;
  livingRoomArea?: number;
  livingRoomType?: string;
  
  hasLoggia: boolean;
  loggiaArea?: number;
  
  hasVeranda: boolean;
  verandaArea?: number;
  
  hasYard: boolean;
  yardArea?: number;
  
  hasStorage: boolean;
  storageArea?: number;
  storageType?: string;

  // Related entities
  features: IFeature[];
  advantages: IAdvantage[];
  furnitureAppliances: IFurnitureAppliance[];
  tags: ITag[];

  // Pricing
  area: number;
  totalPrice: number;
  pricePerSqm?: number;
  currency: string;

  // Contact Information
  contactName: string;
  contactPhone: string;

  // Descriptions
  descriptionGeorgian?: string;
  descriptionEnglish?: string;
  descriptionRussian?: string;

  // SEO & Meta
  metaTitle?: string;
  metaDescription?: string;
  slug?: string;

  // Status & Metrics
  viewCount: number;
  favoriteCount: number;
  inquiryCount: number;
  isFeatured: boolean;
  featuredUntil?: Date;

  // Photos
  photos: IPropertyPhoto[];

  // Dates
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  expiresAt?: Date;
}

export interface CreatePropertyInput {
  title: string;
  propertyType: PropertyTypeEnum;
  dealType: DealTypeEnum;
  dailyRentalSubcategory?: string;
  
  // Location
  cityId: number;
  district?: string;
  street: string;
  streetNumber?: string;
  postalCode?: string;
  cadastralCode?: string;
  latitude?: number;
  longitude?: number;
  
  // Property Details
  rooms?: string;
  bedrooms?: string;
  bathrooms?: string;
  totalFloors?: string;
  propertyFloor?: string;
  buildingStatus?: BuildingStatusEnum;
  constructionYear?: ConstructionYearEnum;
  condition?: ConditionEnum;
  projectType?: string;
  ceilingHeight?: number;
  
  // Infrastructure
  heating?: string;
  parking?: string;
  hotWater?: string;
  buildingMaterial?: string;
  
  // Conditional Features
  hasBalcony?: boolean;
  balconyCount?: number;
  balconyArea?: number;
  hasPool?: boolean;
  poolType?: string;
  hasLivingRoom?: boolean;
  livingRoomArea?: number;
  livingRoomType?: string;
  hasLoggia?: boolean;
  loggiaArea?: number;
  hasVeranda?: boolean;
  verandaArea?: number;
  hasYard?: boolean;
  yardArea?: number;
  hasStorage?: boolean;
  storageArea?: number;
  storageType?: string;
  
  // Related entities (IDs)
  features?: number[];
  advantages?: number[];
  furnitureAppliances?: number[];
  tags?: number[];
  
  // Pricing
  area: number;
  totalPrice: number;
  pricePerSqm?: number;
  currency?: string;
  
  // Contact Information
  contactName: string;
  contactPhone: string;
  
  // Descriptions
  descriptionGeorgian?: string;
  descriptionEnglish?: string;
  descriptionRussian?: string;
  
  // SEO & Meta
  metaTitle?: string;
  metaDescription?: string;
  
  // Photos (input data for creating photos)
  photos?: CreatePropertyPhotoInput[];
}

export interface CreatePropertyPhotoInput {
  fileName: string;
  originalName?: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  altText?: string;
  isPrimary?: boolean;
}

export interface PropertyResponse extends IProperty {
  user: {
    id: number;
    fullName: string;
    phone?: string;
  };
}

export interface PropertyListResponse {
  success: boolean;
  data: {
    properties: PropertyResponse[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface PropertyFilterInput {
  page?: number;
  limit?: number;
  cityId?: number;
  propertyType?: PropertyTypeEnum;
  dealType?: DealTypeEnum;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  district?: string;
  rooms?: string;
  bedrooms?: string;
  bathrooms?: string;
  features?: number[];
  advantages?: number[];
  tags?: number[];
  isFeatured?: boolean;
}