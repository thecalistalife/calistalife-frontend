import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    const allowlist = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      process.env.CLIENT_URL || 'http://localhost:5173',
      'http://localhost:3000'
    ];
    if (!origin || allowlist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TheCalista API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    port: process.env.PORT
  });
});

// API status route
app.get('/api/status', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TheCalista Backend API',
    version: '1.0.0',
    features: {
      oauth_enabled: process.env.OAUTH_ENABLED === 'true',
      personalized_ai: process.env.PERSONALIZED_AI_ENABLED === 'true',
      supabase_configured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
    }
  });
});

// Sample products endpoint (mock data)
app.get('/api/products', (req, res) => {
  const sampleProducts = [
    {
      id: '1',
      name: 'Minimal Tee',
      brand: 'TheCalista',
      price: 49.99,
      images: ['/api/placeholder/product1.jpg'],
      description: 'A perfect blend of comfort and style. Made from 100% organic cotton.',
      category: 'T-Shirts',
      collection: 'Urban Essentials',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['Black', 'White', 'Gray'],
      inStock: true,
      rating: 4.8,
      reviews: 156,
      isNew: true
    },
    {
      id: '2',
      name: 'Monochrome Hoodie',
      brand: 'TheCalista',
      price: 89.99,
      images: ['/api/placeholder/product2.jpg'],
      description: 'Premium hoodie with modern silhouette and kangaroo pocket.',
      category: 'Hoodies',
      collection: 'Night Collection',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Black', 'Gray', 'White'],
      inStock: true,
      rating: 4.6,
      reviews: 89,
      isBestSeller: true
    }
  ];

  res.status(200).json({
    success: true,
    message: 'Products retrieved successfully',
    data: sampleProducts,
    count: sampleProducts.length
  });
});

// Placeholder image endpoint
app.get('/api/placeholder/:filename', (req, res) => {
  res.status(200).json({
    message: 'Placeholder image endpoint',
    filename: req.params.filename,
    note: 'In production, this would serve actual product images'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Start server
const startServer = async () => {
  const PORT = process.env.PORT || 3001;
  
  console.log('🔧 Configuration loaded:');
  console.log('   - Supabase URL:', process.env.SUPABASE_URL ? 'Configured ✅' : 'Not configured ❌');
  console.log('   - Google OAuth:', process.env.GOOGLE_CLIENT_ID ? 'Configured ✅' : 'Not configured ❌');
  console.log('   - Gemini AI:', process.env.GEMINI_API_KEY ? 'Configured ✅' : 'Not configured ❌');
  
  const server = app.listen(PORT, () => {
    console.log('🚀 TheCalista Backend Server Started');
    console.log(`📍 Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Local URL: http://localhost:${PORT}`);
    console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📊 API Status: http://localhost:${PORT}/api/status`);
    console.log(`🛍️  Products: http://localhost:${PORT}/api/products`);
  });

  // Handle server errors
  server.on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use`);
      process.exit(1);
    } else {
      console.error('❌ Server error:', error);
    }
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('🔄 Received SIGINT. Gracefully shutting down...');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });
};

// Start the application
startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

export default app;