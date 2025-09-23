require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { seedProducts } = require('./seeders/productSeeder');

// Exported for testing
let server;

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

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wallet', walletRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Beverage E-Commerce Backend API',
    version: '1.0.0',
    status: 'Running',
    timestamp: new Date().toISOString()
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
app.use((err, req, res, next) => {
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
  try {
    await mongoose.connect(MONGO_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Connected to MongoDB');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    
    // Auto-seed products if none exist
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
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};


if (require.main === module) {
  // Only start server if run directly
  const startServer = async () => {
    await connectToDatabase();
    server = app.listen(PORT, () => {
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

module.exports = app;
