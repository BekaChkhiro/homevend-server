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


// Flitt success handler - Receives POST from Flitt and redirects user browser
const handleFlittSuccess = (req, res) => {
  try {
    console.log('🎉🎉🎉 FLITT SUCCESS ROUTE HIT! 🎉🎉🎉');
    console.log('Method:', req.method);
    console.log('Query params:', JSON.stringify(req.query, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Headers:', JSON.stringify(req.headers, null, 2));

    // Extract payment status from POST body
    const { order_status, response_status, order_id, payment_id } = req.body;

    // Determine the correct client URL based on environment
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:8080';

    // Check if payment was successful
    const isSuccess = order_status === 'approved' && response_status === 'success';
    const redirectUrl = isSuccess
      ? `${clientUrl}/en/dashboard/balance?payment=success&orderId=${order_id}`
      : `${clientUrl}/en/dashboard/balance?payment=failed&orderId=${order_id}`;

    console.log('📤 Flitt POST received - payment status:', isSuccess ? 'SUCCESS' : 'FAILED');
    console.log('📤 Order ID:', order_id);
    console.log('📤 Payment ID:', payment_id);
    console.log('📤 Redirecting user to:', redirectUrl);

    // For POST requests after payment, use 303 See Other redirect
    // 303 tells the browser to redirect using GET method (standard for POST-Redirect-GET pattern)
    if (req.method === 'POST') {
      console.log('📤 Using 303 See Other redirect (POST-Redirect-GET pattern)');
      return res.redirect(303, redirectUrl);
    }

    // For GET requests, use standard 302 redirect
    console.log('📤 Using 302 redirect for GET request');
    return res.redirect(302, redirectUrl);

  } catch (error) {
    console.error('❌ Error in flitt-success route:', error);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:8080';
    const failedRedirectUrl = `${clientUrl}/en/dashboard/balance?payment=error`;

    // Use 303 redirect even for errors
    return res.redirect(303, failedRedirectUrl);
  }
};

app.get('/api/flitt-success', handleFlittSuccess);
app.post('/api/flitt-success', handleFlittSuccess);

// Test endpoint to verify the route works
app.get('/api/test-flitt', (req, res) => {
  console.log('🧪 Test route hit');
  res.json({ message: 'Flitt route is working!', timestamp: new Date().toISOString() });
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