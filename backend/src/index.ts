import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';

// Import middleware
import {
  errorHandler,
  notFound,
  generalRateLimit,
  requestLogger,
  corsOptions
} from './middleware/index';

// Import routes
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import paymentsRoutes from './routes/payments';
import cartRoutes from './routes/cart';
import orderRoutes from './routes/orders';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS middleware
app.use(cors(corsOptions));

// Rate limiting
app.use(generalRateLimit);

// Body parsing middleware (JSON for most routes)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging
app.use(requestLogger);

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TheCalista API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Handle 404
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server (Supabase is HTTP-based, no DB connect step required here)
const startServer = async () => {
  const PORT = process.env.PORT || 3001;
  
  const server = app.listen(PORT, () => {
    console.log('🚀 TheCalista Backend Server Started');
    console.log(`📍 Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Local URL: http://localhost:${PORT}`);
    console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
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
};

// Start the application
startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

export default app;
