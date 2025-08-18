import { DataSource } from 'typeorm';
import dotenv from 'dotenv';

dotenv.config();

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
  synchronize: false,
  logging: false,
  entities: ['src/models/*.ts'],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts']
});