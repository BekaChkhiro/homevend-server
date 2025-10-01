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
import { startPaymentVerificationJob } from './utils/paymentVerification.js';
import { flittScheduler } from './services/FlittScheduler.js';

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS configuration - Allow requests from multiple origins including Flitt
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      process.env.CLIENT_URL || 'http://localhost:8082',
      'http://localhost:8080',
      'http://localhost:8081',
      'http://192.168.68.69:8082',
      'https://homevend.ge',
      'https://www.homevend.ge',
      'http://localhost:3000',
      'https://pay.flitt.com',  // Flitt payment gateway
      'https://flitt.com'
    ];

    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('flitt.com')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins for now to ensure Flitt works
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'Cache-Control', 'Pragma', 'Expires'],
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


// Flitt success handler - Receives POST from Flitt and redirects user
const handleFlittSuccess = (req, res) => {
  try {
    // Extract payment status from either POST body or GET query params
    const paymentData = req.method === 'POST' ? req.body : req.query;
    const { order_status, response_status, order_id } = paymentData;

    // Determine the correct client URL based on environment
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:8080';

    // Check if payment was successful
    const isSuccess = order_status === 'approved' && response_status === 'success';
    const redirectUrl = isSuccess
      ? `${clientUrl}/en/dashboard/balance?payment=success&orderId=${order_id}`
      : `${clientUrl}/en/dashboard/balance?payment=failed&orderId=${order_id}`;

    console.log(`Flitt payment ${isSuccess ? 'success' : 'failed'} - redirecting to dashboard (Order: ${order_id})`);

    // Use HTTP 303 redirect for POST (converts to GET)
    res.redirect(req.method === 'POST' ? 303 : 302, redirectUrl);

  } catch (error) {
    console.error('Error in flitt-success route:', error);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:8080';
    const failedRedirectUrl = `${clientUrl}/en/dashboard/balance?payment=error`;
    res.redirect(303, failedRedirectUrl);
  }
};

app.get('/api/flitt-success', handleFlittSuccess);
app.post('/api/flitt-success', handleFlittSuccess);

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

    // Start payment verification job
    startPaymentVerificationJob();

    // Start Flitt automatic verification scheduler (every 2 minutes)
    flittScheduler.start(2);
    console.log('🔄 Flitt automatic verification scheduler started');
    
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