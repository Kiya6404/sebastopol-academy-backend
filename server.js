require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./src/config/database');

const app = express();

// Get frontend URL list
const getFrontendUrls = () => {
  const urls = [
    process.env.CLIENT_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',

    
    'https://sebastopol-gamma.vercel.app',

    
    'https://sebastopol-academy-backend-production.up.railway.app'
  ];

  // Allow any Vercel preview deployments
  if (process.env.CLIENT_URL && process.env.CLIENT_URL.includes('vercel.app')) {
    urls.push('https://*.vercel.app');
  }

  return urls.filter(Boolean); // remove undefined
};

const allowedOrigins = getFrontendUrls();
console.log('🌍 CORS Allowed Origins:', allowedOrigins);

// Enhanced CORS middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow mobile/curl

    const isAllowed = allowedOrigins.some(allowed => {
      // wildcard domain: *.vercel.app
      if (allowed.includes('*')) {
        const domain = allowed.replace('*.', '');
        return origin.endsWith(domain);
      }
      return origin === allowed;
    });

    if (isAllowed) {
      return callback(null, true);
    }

    console.log('❌ CORS Blocked:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Preflight
app.options('*', cors());

// Security
app.use(helmet());

// Rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, try again later.' }
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database
connectDB();

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/lessons', require('./src/routes/lessons'));
app.use('/api/news', require('./src/routes/news'));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    message: 'Sebastopol Security Academy API is running!',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Sebastopol Security Academy API',
    environment: process.env.NODE_ENV,
    endpoints: {
      auth: '/api/auth',
      lessons: '/api/lessons',
      news: '/api/news',
      health: '/api/health'
    }
  });
});

// Errors
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Sebastopol Academy Backend running on port ${PORT}`);
  console.log('🌍 Environment:', process.env.NODE_ENV);
  console.log('🔗 CORS enabled for:', allowedOrigins);
});

module.exports = app;
