// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { connectDB, AppDataSource } from './config/database.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { sanitizeInput, preventSQLInjection } from './middleware/security.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { initializeScheduler } from './utils/scheduler.js';

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:8082',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://192.168.68.69:8082',
    'https://homevend.ge',
    'https://www.homevend.ge',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Body parsing and compression
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined'));

// Security middleware
app.use(sanitizeInput);
app.use(preventSQLInjection);
app.use('/api', apiRateLimiter);

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api', routes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
    // Initialize scheduled tasks after database connection
    initializeScheduler();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:8082'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();