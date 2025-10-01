require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { seedProducts } = require('./seeders/productSeeder');
const { seedDemoUser } = require('./seeders/userSeeder');

// Exported for testing
let _server;

// Environment validation
const validateEnvironment = () => {
  const requiredEnvVars = ['JWT_SECRET'];
  const recommendedEnvVars = [
    'MPESA_CONSUMER_KEY',
    'MPESA_CONSUMER_SECRET',
    'MPESA_SHORTCODE',
    'MPESA_PASSKEY',
    'MPESA_CALLBACK_URL'
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  const missingRecommended = recommendedEnvVars.filter(envVar => !process.env[envVar]);

  if (missing.length > 0) {
    console.error('❌ CRITICAL: Missing required environment variables:', missing.join(', '));
    console.error('Application cannot start without these variables.');
    process.exit(1);
  }

  if (missingRecommended.length > 0) {
    console.warn('⚠️  Missing recommended environment variables:', missingRecommended.join(', '));
    console.warn('M-Pesa functionality will not work properly.');
  }

  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  JWT_SECRET should be at least 32 characters long for security.');
  }

  // Validate M-Pesa phone format in shortcode
  if (process.env.MPESA_SHORTCODE && !process.env.MPESA_SHORTCODE.match(/^[0-9]+$/)) {
    console.warn('⚠️  MPESA_SHORTCODE should contain only numbers.');
  }

  console.log('✅ Environment validation completed');
};

// Run environment validation
validateEnvironment();

const app = express();

// Enhanced CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'http://localhost:3000'
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const walletRoutes = require('./routes/wallet');
const checkoutRoutes = require('./routes/checkout');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/checkout', checkoutRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Beverage E-Commerce Backend API',
    version: '1.0.0',
    status: 'Running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/health', (req, res) => {
  const mpesaService = require('./services/mpesaService');
  const configStatus = mpesaService.getConfigStatus();

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    mpesa: {
      configured: configStatus.configured,
      environment: configStatus.environment
    },
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    }
  });
});

// Configuration status endpoint
app.get('/api/config/status', (req, res) => {
  const mpesaService = require('./services/mpesaService');
  const configStatus = mpesaService.getConfigStatus();

  res.json({
    jwt: {
      configured: !!process.env.JWT_SECRET,
      secretLength: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0
    },
    database: {
      uri: process.env.MONGO_URI ? 'configured' : 'using default',
      connected: mongoose.connection.readyState === 1
    },
    mpesa: configStatus,
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 5000,
      frontendUrl: process.env.FRONTEND_URL || 'not set'
    }
  });
});

// Seed products endpoint (for development)
app.post('/api/seed/products', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        message: 'Product seeding is disabled in production'
      });
    }

    const products = await seedProducts();
    res.json({
      message: 'Products seeded successfully',
      count: products.length
    });
  } catch (error) {
    console.error('Error seeding products:', error);
    res.status(500).json({
      message: 'Error seeding products',
      error: error.message
    });
  }
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/beverage_ecommerce';

// Enhanced MongoDB connection
const connectToDatabase = async () => {
  const maxAttempts = parseInt(process.env.MONGO_CONNECT_MAX_ATTEMPTS || '10', 10);
  const baseDelayMs = parseInt(process.env.MONGO_CONNECT_BASE_DELAY_MS || '1000', 10);

  let attempt = 0;

  while (true) {
    attempt += 1;
    try {
      console.log(`Attempting to connect to MongoDB (attempt ${attempt})...`);
      await mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      console.log('✅ Connected to MongoDB');
      console.log(`📊 Database: ${mongoose.connection.name}`);

      // Event hooks for connection health
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error (event):', err.message || err);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected. Will attempt to reconnect.');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
      });

      // Auto-seed products if none exist (only on first successful connection)
      try {
  if (process.env.NODE_ENV !== 'production' || process.env.FORCE_SEED === 'true') {
          const Product = require('./models/Product');
          const productCount = await Product.countDocuments();
          if (productCount === 0) {
            console.log('🌱 No products found. Seeding sample products...');
            try {
              await seedProducts();
              console.log('✅ Sample products seeded successfully');
            } catch (seedError) {
              console.error('❌ Error seeding products:', seedError.message);
            }
          } else {
            console.log(`📦 Found ${productCount} products in database`);
          }

          // Ensure a demo/admin user exists for development/testing
          try {
            await seedDemoUser();
            console.log('✅ Demo user ensured');
          } catch (userSeedError) {
            console.error('❌ Error ensuring demo user:', userSeedError.message);
          }
        }
      } catch (seedErr) {
        console.error('Seeding check error:', seedErr.message || seedErr);
      }

      // Connected successfully - exit the loop
      break;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error.message || error);

      if (attempt >= maxAttempts) {
        // After exhausting attempts, switch to periodic retries but don't exit the process
        const periodicDelayMs = parseInt(process.env.MONGO_CONNECT_PERIODIC_DELAY_MS || '30000', 10);
        console.error(`Exceeded ${maxAttempts} attempts. Will retry every ${periodicDelayMs / 1000}s until MongoDB is available.`);

        // Wait until successful connection in a setInterval loop
        await new Promise((resolve) => {
          const handle = setInterval(async () => {
            try {
              console.log('Periodic retry: attempting to reconnect to MongoDB...');
              await mongoose.connect(MONGO_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
              });
              console.log('✅ Reconnected to MongoDB (periodic retry)');
              clearInterval(handle);
              resolve();
            } catch (err) {
              console.warn('Periodic retry failed:', err.message || err);
            }
          }, periodicDelayMs);
        });

        // After periodic retry resolves, break the outer loop
        break;
      }

      // Exponential backoff before next attempt
      const delayMs = Math.min(baseDelayMs * (2 ** (attempt - 1)), 30000);
      console.log(`Waiting ${delayMs}ms before next MongoDB connection attempt...`);
      // eslint-disable-next-line no-await-in-loop
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
};

if (require.main === module) {
  // Only start server if run directly
  const startServer = async () => {
    await connectToDatabase();
    _server = app.listen(PORT, () => {
      console.log('🚀 Server started successfully');
      console.log(`📍 Port: ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Health: http://localhost:${PORT}/api/health`);
      console.log(`⚙️  Config Status: http://localhost:${PORT}/api/config/status`);
      // Display M-Pesa status
      const mpesaService = require('./services/mpesaService');
      const configStatus = mpesaService.getConfigStatus();
      if (configStatus.configured) {
        console.log(`💳 M-Pesa: Configured (${configStatus.environment})`);
      } else {
        console.log('💳 M-Pesa: Not configured - payments will not work');
      }
    });
  };

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    mongoose.connection.close(() => {
      console.log('Database connection closed.');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    mongoose.connection.close(() => {
      console.log('Database connection closed.');
      process.exit(0);
    });
  });

  startServer();
}

module.exports = { app, server: _server };
