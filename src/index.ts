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


// Flitt success handler - must handle POST requests from Flitt
app.all('/api/flitt-success', (req, res) => {
  try {
    console.log('🎉🎉🎉 FLITT SUCCESS ROUTE HIT! 🎉🎉🎉');
    console.log('Method:', req.method);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Query:', JSON.stringify(req.query, null, 2));
    console.log('URL:', req.url);
    console.log('Original URL:', req.originalUrl);

    // Set headers explicitly
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Payment Successful</title>
  <meta http-equiv="refresh" content="0;url=/en/dashboard/balance?payment=success">
</head>
<body>
  <h1>Payment Successful!</h1>
  <p>Redirecting...</p>
  <script>
    console.log('Redirecting from Flitt success page...');
    window.location.replace('/en/dashboard/balance?payment=success');
  </script>
  <noscript>
    <a href="/en/dashboard/balance?payment=success">Click here if not redirected</a>
  </noscript>
</body>
</html>`;

    console.log('📤 Sending HTML response, length:', html.length);
    res.status(200).send(html);
    console.log('✅ Response sent successfully');

  } catch (error) {
    console.error('❌ Error in flitt-success route:', error);
    res.status(500).send('Error processing payment redirect');
  }
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