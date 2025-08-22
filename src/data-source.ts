import dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';

// Create a new DataSource instance with proper typing
// Use DATABASE_URL if available, otherwise use individual parameters
const isRenderDB = process.env.DB_HOST?.includes('render.com') || process.env.DATABASE_URL?.includes('render.com');
const dbConfig = process.env.DATABASE_URL ? {
  type: 'postgres' as const,
  url: process.env.DATABASE_URL,
  ssl: isRenderDB ? { rejectUnauthorized: false } : false
} : {
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'homevend',
  ssl: isRenderDB ? { rejectUnauthorized: false } : false
};

export default new DataSource({
  ...dbConfig,
  synchronize: false, // Always use migrations instead
  logging: false,
  entities: [
    'dist/models/User.js',
    'dist/models/Property.js',
    'dist/models/District.js',
    'dist/models/Area.js',
    'dist/models/PriceStatistic.js',
    'dist/models/City.js',
    'dist/models/Feature.js',
    'dist/models/Advantage.js',
    'dist/models/FurnitureAppliance.js',
    'dist/models/Tag.js',
    'dist/models/PropertyPhoto.js',
    'dist/models/UserFavorite.js',
    'dist/models/PropertyInquiry.js',
    'dist/models/PropertyView.js',
    'dist/models/Agency.js',
    'dist/models/Developer.js',
    'dist/models/Project.js',
    'dist/models/ProjectPricing.js',
    'dist/models/ProjectAmenity.js',
    'dist/models/VipPricing.js',
    'dist/models/PropertyVipService.js',
    'dist/models/ServicePricing.js',
    'dist/models/Transaction.js'
  ],
  migrations: ['dist/migrations/*.js'],
  subscribers: ['dist/subscribers/*.js']
});