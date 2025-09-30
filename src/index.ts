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
app.all('/flitt-success.html', (req, res) => {
  console.log('🎉 Flitt POST redirect received!');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Query:', req.query);

  // Serve the HTML content directly
  res.type('html').send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Successful - HomeVend</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 50px;
                background-color: #f5f5f5;
            }
            .container {
                max-width: 400px;
                margin: 0 auto;
                background: white;
                padding: 40px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .success-icon {
                width: 60px;
                height: 60px;
                background: #22c55e;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px;
                color: white;
                font-size: 24px;
            }
            .countdown {
                background: #eff6ff;
                padding: 15px;
                border-radius: 6px;
                margin: 20px 0;
                color: #1d4ed8;
            }
            .btn {
                background: #3b82f6;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                cursor: pointer;
                margin: 5px;
                text-decoration: none;
                display: inline-block;
            }
            .btn:hover {
                background: #2563eb;
            }
            .btn-success {
                background: #10b981;
            }
            .btn-success:hover {
                background: #059669;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="success-icon">✓</div>
            <h1>Payment Successful!</h1>
            <p>Your balance has been updated. Thank you for your payment!</p>

            <div class="countdown" id="countdown">
                Redirecting to dashboard in <span id="timer">5</span> seconds...
            </div>

            <div>
                <a href="/en/dashboard" class="btn">Go to Dashboard</a>
                <a href="/en/dashboard/balance" class="btn btn-success">View Balance</a>
            </div>

            <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
                If this page doesn't redirect automatically, click the buttons above.
            </p>
        </div>

        <script>
            console.log('Flitt payment success page loaded');
            console.log('Current URL:', window.location.href);
            console.log('URL Parameters:', new URLSearchParams(window.location.search));

            let countdown = 5;
            const timerElement = document.getElementById('timer');

            const timer = setInterval(() => {
                countdown--;
                timerElement.textContent = countdown;

                if (countdown <= 0) {
                    clearInterval(timer);
                    console.log('Redirecting to dashboard...');
                    window.location.href = '/en/dashboard/balance?payment=success';
                }
            }, 1000);

            // Also redirect immediately if user clicks anywhere
            document.addEventListener('click', () => {
                if (countdown > 0) {
                    clearInterval(timer);
                    window.location.href = '/en/dashboard/balance?payment=success';
                }
            });
        </script>
    </body>
    </html>
  `);
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