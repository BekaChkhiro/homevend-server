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
    'http://localhost:3000',
    'https://pay.flitt.com',  // Add Flitt's domain for iframe POST requests
    'https://flitt.com'
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


// Flitt success handler - Receives request from Flitt and redirects user
const handleFlittSuccess = (req, res) => {
  try {
    console.log('');
    console.log('='.repeat(80));
    console.log('🎉🎉🎉 FLITT SUCCESS ROUTE HIT! 🎉🎉🎉');
    console.log('='.repeat(80));
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('🔧 Method:', req.method);
    console.log('🔗 URL:', req.url);
    console.log('📍 Path:', req.path);
    console.log('❓ Query params:', JSON.stringify(req.query, null, 2));
    console.log('📦 Body type:', typeof req.body);
    console.log('📦 Body is empty?', Object.keys(req.body || {}).length === 0);
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
    console.log('📨 Headers:', JSON.stringify(req.headers, null, 2));
    console.log('🌐 Origin:', req.headers.origin);
    console.log('🔐 Content-Type:', req.headers['content-type']);
    console.log('='.repeat(80));

    // Extract payment status from either POST body or GET query params
    const paymentData = req.method === 'POST' ? req.body : req.query;
    const { order_status, response_status, order_id, payment_id } = paymentData;

    console.log('💳 Payment data source:', req.method === 'POST' ? 'POST body' : 'GET query params');
    console.log('💳 Payment status:', order_status, response_status);

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

    // Flitt POSTs inside an iframe with target="_top" in payload
    // Use multiple methods to ensure redirect works across different scenarios
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Payment Processing - Redirecting...</title>
        <meta http-equiv="refresh" content="0;url=${redirectUrl}">
      </head>
      <body>
        <script type="text/javascript">
          // Try multiple methods to break out of iframe
          (function() {
            var redirectUrl = '${redirectUrl}';

            try {
              // Method 1: Try to redirect top window
              if (window.top && window.top !== window.self) {
                window.top.location.href = redirectUrl;
              } else {
                // Method 2: Regular redirect if not in iframe
                window.location.href = redirectUrl;
              }
            } catch (e) {
              console.log('Top redirect blocked, trying parent');
              try {
                // Method 3: Try parent window if top is blocked
                if (window.parent && window.parent !== window.self) {
                  window.parent.location.href = redirectUrl;
                } else {
                  window.location.href = redirectUrl;
                }
              } catch (e2) {
                console.log('Parent redirect also blocked, using location.replace');
                // Method 4: Last resort - replace current location
                window.location.replace(redirectUrl);
              }
            }
          })();
        </script>
        <form id="redirectForm" action="${redirectUrl}" method="GET" target="_top">
          <noscript>
            <p>Payment ${isSuccess ? 'successful' : 'failed'}.</p>
            <p><button type="submit">Click here to continue</button></p>
          </noscript>
        </form>
        <script type="text/javascript">
          // Method 5: Auto-submit form with target="_top" as fallback
          setTimeout(function() {
            document.getElementById('redirectForm').submit();
          }, 100);
        </script>
      </body>
      </html>
    `;

    console.log('✅ Sending HTML response with multiple redirect methods');
    console.log('📄 HTML length:', html.length, 'characters');
    console.log('🎯 Redirect URL:', redirectUrl);

    // Set headers to prevent caching
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Frame-Options': 'ALLOWALL',
      'Content-Type': 'text/html; charset=utf-8'
    });

    console.log('📤 Response status: 200');
    console.log('📤 Response headers set');
    console.log('📤 About to send HTML...');

    res.status(200).send(html);

    console.log('✅ HTML sent successfully!');
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