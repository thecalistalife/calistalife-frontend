import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import * as Sentry from '@sentry/node';
import pinoHttp from 'pino-http';
import { logger } from '@/utils/logger';
import { config } from '@/utils/config';

// Import middleware
import {
  errorHandler,
  notFound,
  generalRateLimit,
  corsOptions
} from './middleware/index';

// Import routes
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import paymentsRoutes from './routes/payments';
import cartRoutes from './routes/cart';
import orderRoutes from './routes/orders';
import adminRoutes from './routes/admin';
import marketingRoutes from './routes/marketing';
import reviewRoutes from './routes/reviews';
import { initAbandonedCartScheduler } from './services/abandonedCart';

// Import webhook handlers before JSON parser to capture raw body
import { handleStripeWebhook, handleRazorpayWebhook } from './controllers/payments';

// Load environment variables (resolve to project root .env in both src and dist)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Sentry init (if DSN provided)
if (config.SENTRY_DSN) {
  Sentry.init({ dsn: config.SENTRY_DSN, tracesSampleRate: 0.2, environment: config.NODE_ENV });
}

// Create Express app
const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// (Optional) Sentry request handler omitted to avoid type differences across versions

// CORS middleware
app.use(cors(corsOptions));

// Request logging (structured)
app.use(pinoHttp({ logger }));

// Rate limiting
app.use(generalRateLimit);

// Mount webhook routes with raw body BEFORE JSON parser
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);
app.post('/api/payments/razorpay/webhook', express.raw({ type: 'application/json' }), handleRazorpayWebhook);

// Body parsing middleware (JSON for most routes)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

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
app.use('/api/marketing', marketingRoutes);
app.use('/api/reviews', reviewRoutes);

// Secret Admin routes (mounted under hidden base path)
const ADMIN_BASE = `/${(process.env.ADMIN_BASE_PATH || 'cl-private-dashboard-2024').replace(/^\/+|\/+$/g,'')}`;
app.use(ADMIN_BASE, adminRoutes);
// Also serve admin API under /api/{ADMIN_BASE_PATH} so frontend can call via the /api proxy
app.use(`/api${ADMIN_BASE}`, adminRoutes);

// Handle 404
app.use(notFound);

// (Optional) Sentry error handler omitted; errors are captured in global error handler

// Global error handler
app.use(errorHandler);

// Start server (Supabase is HTTP-based, no DB connect step required here)
const startServer = async () => {
  const PORT = process.env.PORT || 3001;
  
  // Ensure storage bucket for product images exists (public)
  try {
    const { supabaseAdmin } = await import('./utils/supabase');
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const hasProducts = (buckets || []).some((b: any) => b.name === 'products');
    if (!hasProducts) {
      await supabaseAdmin.storage.createBucket('products', { public: true });
      logger.info('🪣 Created Supabase storage bucket "products"');
    }
    const hasReviews = (buckets || []).some((b: any) => b.name === 'reviews');
    if (!hasReviews) {
      await supabaseAdmin.storage.createBucket('reviews', { public: true });
      logger.info('🪣 Created Supabase storage bucket "reviews"');
    }
  } catch (e) {
    logger.warn({ err: e }, 'Failed to ensure Supabase storage bucket');
  }
  
  // Initialize persistent email queue
  try {
    const { persistentEmailQueue } = await import('./services/persistentEmailQueue');
    await persistentEmailQueue.init();
  } catch (e) {
    logger.warn({ err: e }, 'Failed to initialize persistent email queue');
  }

  // Start abandoned cart scheduler (marketing automation)
  try { initAbandonedCartScheduler(); logger.info('🕒 Abandoned cart scheduler started'); } catch (e) { logger.warn({ err: e }, 'Failed to start abandoned cart scheduler'); }
  
  const server = app.listen(PORT, async () => {
    logger.info('🚀 TheCalista Backend Server Started');
    logger.info(`📍 Server running on port ${PORT}`);
    logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🔗 Local URL: http://localhost:${PORT}`);
    logger.info(`💚 Health Check: http://localhost:${PORT}/api/health`);
    // Supabase connection test & diagnostics
    try {
      const { testConnection } = await import('./utils/supabase');
      const ok = await testConnection();
      if (ok) logger.info('✅ Supabase connection OK');
      else logger.warn('⚠️  Supabase connection test failed. Check SUPABASE_URL/keys in backend/.env');
    } catch (e) {
      logger.warn({ err: e }, '⚠️  Supabase connection test encountered an error');
    }
  });

  // Handle server errors
  server.on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`❌ Port ${PORT} is already in use`);
      process.exit(1);
    } else {
      logger.error({ err: error }, '❌ Server error');
    }
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('🔄 Received SIGINT. Gracefully shutting down...');
    
    // Cleanup email queue
    try {
      const { persistentEmailQueue } = await import('./services/persistentEmailQueue');
      persistentEmailQueue.cleanup();
    } catch {}
    
    server.close(() => {
      logger.info('✅ Server closed');
      process.exit(0);
    });
  });
};

// Start the application
startServer().catch((error) => {
  logger.error({ err: error }, '❌ Failed to start server');
  process.exit(1);
});

export default app;
