import { DataSource } from 'typeorm';
import { User } from '../models/User.js';
import { Property } from '../models/Property.js';

// Create a new DataSource instance with proper typing
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'dato123',
  database: process.env.DB_NAME || 'homevend',
  synchronize: false, // Always use migrations instead
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Property],
  migrations: ['dist/migrations/*.js'],
  subscribers: ['dist/subscribers/*.js'],
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  extra: {
    trustServerCertificate: true
  }
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