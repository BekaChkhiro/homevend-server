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
    Agency
  ],
  migrations: ['dist/migrations/*.js'],
  subscribers: ['dist/subscribers/*.js']
});