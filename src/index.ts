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


// Flitt success handler - Handle both GET and POST requests
const handleFlittSuccess = (req, res) => {
  try {
    console.log('🎉🎉🎉 FLITT SUCCESS ROUTE HIT! 🎉🎉🎉');
    console.log('Method:', req.method);
    console.log('Query params:', JSON.stringify(req.query, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Headers:', JSON.stringify(req.headers, null, 2));

    // Determine the correct client URL based on environment
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:8080';
    const redirectUrl = `${clientUrl}/en/dashboard/balance?payment=success`;

    // For POST requests, return 200 OK with HTML redirect (Flitt expects 200 status)
    if (req.method === 'POST') {
      console.log('📤 POST request - sending 200 OK with HTML redirect to:', redirectUrl);
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payment Successful - Redirecting...</title>
          <meta charset="UTF-8">
          <meta http-equiv="refresh" content="0;url=${redirectUrl}">
        </head>
        <body>
          <script>
            console.log('Flitt payment success - redirecting with GET...');
            window.location.href = '${redirectUrl}';
          </script>
          <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
            <h2>✅ Payment Successful!</h2>
            <p>Redirecting to your dashboard...</p>
            <p><a href="${redirectUrl}">Click here if you're not redirected automatically</a></p>
          </div>
        </body>
        </html>
      `);
    } else {
      // For GET requests, use 302 redirect
      console.log('📤 GET request - redirecting to:', redirectUrl);
      res.redirect(302, redirectUrl);
    }

    console.log('✅ Response sent successfully');

  } catch (error) {
    console.error('❌ Error in flitt-success route:', error);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:8080';
    const failedRedirectUrl = `${clientUrl}/en/dashboard/balance?payment=failed`;

    if (req.method === 'POST') {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payment Error - Redirecting...</title>
          <meta charset="UTF-8">
          <meta http-equiv="refresh" content="0;url=${failedRedirectUrl}">
        </head>
        <body>
          <script>
            console.log('Flitt payment error - redirecting...');
            window.location.href = '${failedRedirectUrl}';
          </script>
          <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
            <h2>❌ Payment Error</h2>
            <p>Redirecting to your dashboard...</p>
            <p><a href="${failedRedirectUrl}">Click here if you're not redirected automatically</a></p>
          </div>
        </body>
        </html>
      `);
    } else {
      res.redirect(302, failedRedirectUrl);
    }
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