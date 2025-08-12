import { DataSource } from 'typeorm';
import dotenv from 'dotenv';

dotenv.config();

// Use DATABASE_URL if available, otherwise use individual parameters
const dbConfig = process.env.DATABASE_URL ? {
  type: 'postgres' as const,
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
} : {
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'dpg-d2aq47h5pdvs73c2rb4g-a.frankfurt-postgres.render.com',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'homevend',
  password: process.env.DB_PASSWORD || 'zinlNhzI01VGSkjloauNNoArZ68l0yZt',
  database: process.env.DB_NAME || 'homevend_m7yo',
  ssl: { rejectUnauthorized: false }
};

export default new DataSource({
  ...dbConfig,
  synchronize: false,
  logging: false,
  entities: ['src/models/*.ts'],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts']
});