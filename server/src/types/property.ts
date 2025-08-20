export interface IProperty {
  id: string;
  userId: string;
  
  // Basic Info
  title: string;
  propertyType: string;
  dealType: string;
  city: string;
  street: string;
  streetNumber?: string;
  cadastralCode?: string;

  // Property Details
  rooms?: string;
  bedrooms?: string;
  bathrooms?: string;
  totalFloors?: string;
  buildingStatus?: string;
  constructionYear?: string;
  condition?: string;
  projectType?: string;
  ceilingHeight?: string;
  heating?: string;
  parking?: string;
  hotWater?: string;
  buildingMaterial?: string;

  // Conditional fields
  hasBalcony: boolean;
  balconyCount?: string;
  balconyArea?: string;
  
  hasPool: boolean;
  poolType?: string;
  
  hasLivingRoom: boolean;
  livingRoomArea?: string;
  livingRoomType?: string;
  
  hasLoggia: boolean;
  loggiaArea?: string;
  
  hasVeranda: boolean;
  verandaArea?: string;
  
  hasYard: boolean;
  yardArea?: string;
  
  hasStorage: boolean;
  storageArea?: string;
  storageType?: string;

  // Features and amenities
  features: string[];
  advantages: string[];
  furnitureAppliances: string[];
  tags: string[];

  // Price & Area
  area: string;
  totalPrice: string;
  pricePerSqm?: string;

  // Contact Info
  contactName: string;
  contactPhone: string;

  // Descriptions
  descriptionGeorgian?: string;
  descriptionEnglish?: string;
  descriptionRussian?: string;

  // Photos
  photos: string[];

  // Status and metadata
  status: 'active' | 'inactive' | 'pending' | 'sold';
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePropertyInput {
  title: string;
  propertyType: string;
  dealType: string;
  city: string;
  street: string;
  streetNumber?: string;
  cadastralCode?: string;
  rooms?: string;
  bedrooms?: string;
  bathrooms?: string;
  totalFloors?: string;
  buildingStatus?: string;
  constructionYear?: string;
  condition?: string;
  projectType?: string;
  ceilingHeight?: string;
  heating?: string;
  parking?: string;
  hotWater?: string;
  buildingMaterial?: string;
  hasBalcony?: boolean;
  balconyCount?: string;
  balconyArea?: string;
  hasPool?: boolean;
  poolType?: string;
  hasLivingRoom?: boolean;
  livingRoomArea?: string;
  livingRoomType?: string;
  hasLoggia?: boolean;
  loggiaArea?: string;
  hasVeranda?: boolean;
  verandaArea?: string;
  hasYard?: boolean;
  yardArea?: string;
  hasStorage?: boolean;
  storageArea?: string;
  storageType?: string;
  features?: string[];
  advantages?: string[];
  furnitureAppliances?: string[];
  tags?: string[];
  area: string;
  totalPrice: string;
  pricePerSqm?: string;
  contactName: string;
  contactPhone: string;
  descriptionGeorgian?: string;
  descriptionEnglish?: string;
  descriptionRussian?: string;
}

export interface PropertyResponse {
  id: string;
  userId: string;
  title: string;
  propertyType: string;
  dealType: string;
  city: string;
  street: string;
  streetNumber?: string;
  cadastralCode?: string;
  rooms?: string;
  bedrooms?: string;
  bathrooms?: string;
  totalFloors?: string;
  buildingStatus?: string;
  constructionYear?: string;
  condition?: string;
  projectType?: string;
  ceilingHeight?: string;
  heating?: string;
  parking?: string;
  hotWater?: string;
  buildingMaterial?: string;
  hasBalcony: boolean;
  balconyCount?: string;
  balconyArea?: string;
  hasPool: boolean;
  poolType?: string;
  hasLivingRoom: boolean;
  livingRoomArea?: string;
  livingRoomType?: string;
  hasLoggia: boolean;
  loggiaArea?: string;
  hasVeranda: boolean;
  verandaArea?: string;
  hasYard: boolean;
  yardArea?: string;
  hasStorage: boolean;
  storageArea?: string;
  storageType?: string;
  features: string[];
  advantages: string[];
  furnitureAppliances: string[];
  tags: string[];
  area: string;
  totalPrice: string;
  pricePerSqm?: string;
  contactName: string;
  contactPhone: string;
  descriptionGeorgian?: string;
  descriptionEnglish?: string;
  descriptionRussian?: string;
  photos: string[];
  status: 'active' | 'inactive' | 'pending' | 'sold';
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}