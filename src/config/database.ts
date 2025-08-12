import dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import { User } from '../models/User.js';
import { Property } from '../models/Property.js';
import { District } from '../models/District.js';
import { Area } from '../models/Area.js';
import { PriceStatistic } from '../models/PriceStatistic.js';
import { City } from '../models/City.js';
import { Feature } from '../models/Feature.js';
import { Advantage } from '../models/Advantage.js';
import { FurnitureAppliance } from '../models/FurnitureAppliance.js';
import { Tag } from '../models/Tag.js';
import { PropertyPhoto } from '../models/PropertyPhoto.js';
import { UserFavorite } from '../models/UserFavorite.js';
import { PropertyInquiry } from '../models/PropertyInquiry.js';
import { PropertyView } from '../models/PropertyView.js';

// Create a new DataSource instance with proper typing
// Use DATABASE_URL if available, otherwise use individual parameters
const dbConfig = process.env.DATABASE_URL ? {
  type: 'postgres' as const,
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
} : {
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'dpg-d2aq47h5pvs73c2rb4g-a.frankfurt-postgres.render.com',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'homevend1',
  password: process.env.DB_PASSWORD || 'zinlNhzI01VGSkjloauNNoArZ68l0yZt',
  database: process.env.DB_NAME || 'homevend_m7yo',
  ssl: { rejectUnauthorized: false }
};

export const AppDataSource = new DataSource({
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
    PropertyView
  ],
  migrations: ['dist/migrations/*.js'],
  subscribers: ['dist/subscribers/*.js']
});

export const connectDB = async (): Promise<void> => {
  try {
    console.log(`🔄 Connecting to PostgreSQL...`);
    console.log(`📍 Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}`);
    console.log(`👤 User: ${process.env.DB_USERNAME || 'postgres'}`);
    console.log(`💾 Database: ${process.env.DB_NAME || 'homevend'}`);
    
    await AppDataSource.initialize();
    console.log('✅ PostgreSQL Connected successfully');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if PostgreSQL service is running');
    console.log('2. Verify database credentials in .env file');
    console.log('3. Ensure database "homevend" exists');
    process.exit(1);
  }
};

export default AppDataSource;