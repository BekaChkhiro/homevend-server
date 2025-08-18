import dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import { User } from './models/User.js';
import { Property } from './models/Property.js';
import { District } from './models/District.js';
import { Area } from './models/Area.js';
import { PriceStatistic } from './models/PriceStatistic.js';
import { City } from './models/City.js';
import { Feature } from './models/Feature.js';
import { Advantage } from './models/Advantage.js';
import { FurnitureAppliance } from './models/FurnitureAppliance.js';
import { Tag } from './models/Tag.js';
import { PropertyPhoto } from './models/PropertyPhoto.js';
import { UserFavorite } from './models/UserFavorite.js';
import { PropertyInquiry } from './models/PropertyInquiry.js';
import { PropertyView } from './models/PropertyView.js';
import { Agency } from './models/Agency.js';
import { Project } from './models/Project.js';
import { ProjectPricing } from './models/ProjectPricing.js';

// Create a new DataSource instance with proper typing
// Use DATABASE_URL if available, otherwise use individual parameters
const dbConfig = process.env.DATABASE_URL ? {
  type: 'postgres' as const,
  url: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
} : {
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'homevend',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

export default new DataSource({
  ...dbConfig,
  synchronize: false, // Always use migrations instead
  logging: false,
  entities: [
    User, 
    Property, 
    District, 
    Area,
    PriceStatistic, 
    City, 
    Feature, 
    Advantage, 
    FurnitureAppliance, 
    Tag, 
    PropertyPhoto, 
    UserFavorite, 
    PropertyInquiry, 
    PropertyView,
    Agency,
    Project,
    ProjectPricing
  ],
  migrations: ['dist/migrations/*.js'],
  subscribers: ['dist/subscribers/*.js']
});