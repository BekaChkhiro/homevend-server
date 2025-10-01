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
  // Log IMMEDIATELY when function is called
  console.log('');
  console.log('🚨'.repeat(40));
  console.log('⚡ FLITT SUCCESS HANDLER FUNCTION CALLED ⚡');
  console.log('🚨'.repeat(40));

  try {
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('🔧 Method:', req.method);
    console.log('🔗 Full URL:', req.protocol + '://' + req.get('host') + req.originalUrl);
    console.log('📍 Path:', req.path);
    console.log('❓ Query params:', JSON.stringify(req.query, null, 2));
    console.log('📦 Body exists?', !!req.body);
    console.log('📦 Body type:', typeof req.body);
    console.log('📦 Body keys:', Object.keys(req.body || {}));
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
    console.log('🌐 Origin:', req.headers.origin);
    console.log('🔐 Content-Type:', req.headers['content-type']);
    console.log('='.repeat(80));

    // Extract payment status from either POST body or GET query params
    const paymentData = req.method === 'POST' ? req.body : req.query;
    const { order_status, response_status, order_id, payment_id } = paymentData;

    console.log('💳 Payment data source:', req.method === 'POST' ? 'POST body' : 'GET query params');
    console.log('💳 Extracted - order_status:', order_status);
    console.log('💳 Extracted - response_status:', response_status);
    console.log('💳 Extracted - order_id:', order_id);
    console.log('💳 Extracted - payment_id:', payment_id);

    // Determine the correct client URL based on environment
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:8080';

    // Check if payment was successful
    const isSuccess = order_status === 'approved' && response_status === 'success';
    const redirectUrl = isSuccess
      ? `${clientUrl}/en/dashboard/balance?payment=success&orderId=${order_id}`
      : `${clientUrl}/en/dashboard/balance?payment=failed&orderId=${order_id}`;

    console.log('📤 Flitt request received - payment status:', isSuccess ? 'SUCCESS' : 'FAILED');
    console.log('📤 Order ID:', order_id);
    console.log('📤 Payment ID:', payment_id);
    console.log('📤 Redirecting user to:', redirectUrl);

    // For POST requests: Use HTTP 303 "See Other" redirect
    // This tells the browser to make a GET request to the redirect URL
    // This is the standard POST-Redirect-GET pattern
    if (req.method === 'POST') {
      console.log('📤 Using HTTP 303 See Other redirect (POST -> GET)');
      res.redirect(303, redirectUrl);
      console.log('✅ 303 redirect sent!');
    } else {
      // For GET requests: Use standard 302 redirect
      console.log('📤 Using HTTP 302 redirect for GET request');
      res.redirect(302, redirectUrl);
      console.log('✅ 302 redirect sent!');
    }

    console.log('='.repeat(80));
    console.log('');

  } catch (error) {
    console.error('❌ Error in flitt-success route:', error);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:8080';
    const failedRedirectUrl = `${clientUrl}/en/dashboard/balance?payment=error`;

    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Error - Redirecting...</title>
        <meta http-equiv="refresh" content="0;url=${failedRedirectUrl}">
      </head>
      <body>
        <script>
          try {
            if (window.top) window.top.location.href = '${failedRedirectUrl}';
            else window.location.href = '${failedRedirectUrl}';
          } catch(e) {
            window.location.replace('${failedRedirectUrl}');
          }
        </script>
        <p>An error occurred. <a href="${failedRedirectUrl}" target="_top">Click here to continue</a></p>
      </body>
      </html>
    `;

    return res.status(200).type('text/html').send(errorHtml);
  }
};

app.get('/api/flitt-success', handleFlittSuccess);
app.post('/api/flitt-success', handleFlittSuccess);
app.options('/api/flitt-success', (req, res) => {
  console.log('⚙️ OPTIONS request received for /api/flitt-success');
  res.status(200).end();
});

// Simple test endpoint that always returns HTML (to verify routing works)
app.all('/api/flitt-test', (req, res) => {
  console.log('🧪 TEST ENDPOINT HIT - Method:', req.method);
  res.status(200).type('text/html').send(`
    <!DOCTYPE html>
    <html><head><title>Test</title></head>
    <body>
      <h1>Test endpoint works!</h1>
      <p>Method: ${req.method}</p>
      <p>Time: ${new Date().toISOString()}</p>
    </body></html>
  `);
});

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