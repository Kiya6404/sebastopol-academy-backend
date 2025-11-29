require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./src/config/database');

const app = express();

// Get frontend URL from environment with fallbacks
const getFrontendUrls = () => {
  const urls = [
    process.env.CLIENT_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://sebastopol-security-academy.vercel.app' // Add your Vercel URL here
  ].filter(Boolean);
  
  // Also allow any Vercel preview URLs
  if (process.env.CLIENT_URL && process.env.CLIENT_URL.includes('vercel.app')) {
    urls.push('https://*.vercel.app');
  }
  
  return urls;
};

const allowedOrigins = getFrontendUrls();
console.log('🌍 CORS Allowed Origins:', allowedOrigins);

// Enhanced CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        // Handle wildcard domains like *.vercel.app
        const domain = allowedOrigin.replace('*.', '');
        return origin.endsWith(domain);
      }
      return origin === allowedOrigin;
    })) {
      return callback(null, true);
    } else {
      console.log('❌ CORS Blocked:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Handle preflight requests
app.options('*', cors());

// Rest of your middleware
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Connect to databases
connectDB();

// Import routes
const authRoutes = require('./src/routes/auth');
const lessonsRoutes = require('./src/routes/lessons');
const newsRoutes = require('./src/routes/news');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/lessons', lessonsRoutes);
app.use('/api/news', newsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    message: 'Sebastopol Security Academy API is running!',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Sebastopol Security Academy API',
    description: 'Cybersecurity education platform honoring Emperor Tewodros II',
    environment: process.env.NODE_ENV,
    endpoints: {
      auth: '/api/auth',
      lessons: '/api/lessons',
      news: '/api/news',
      health: '/api/health'
    }
  });
});

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
};
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Sebastopol Academy Backend running on port ${PORT}`);
  console.log('🏰 Honoring the legacy of Emperor Tewodros II');
  console.log('🌍 Environment:', process.env.NODE_ENV);
  console.log('🔗 CORS enabled for:', allowedOrigins);
  console.log(`📍 API available at: http://localhost:${PORT}`);
});

module.exports = app;
