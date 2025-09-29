import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

import * as Sentry from '@sentry/node';
import { config } from '@/utils/config';

// Error handling middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  try {
    const { logger } = require('@/utils/logger');
    logger.error({ err, path: req.path }, 'Unhandled error');
    if (config.SENTRY_DSN) {
      Sentry.captureException(err);
    }
  } catch {
    // fallback
    console.error(err);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val: any) => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error'
  });
};

// Not found middleware
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Validation error handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
    return;
  }
  next();
};

// Rate limiting
export const createRateLimit = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message
    }
  });
};

// Common rate limits
export const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts, please try again later'
);

export const generalRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests
  'Too many requests from this IP, please try again later'
);

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path} - ${req.ip}`);
  next();
};

// CORS options
export const corsOptions = {
  origin: function (origin: any, callback: any) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Support multiple origins via CORS_ORIGIN (comma-separated) or single CLIENT_URL
    const fromEnv = (process.env.CORS_ORIGIN || process.env.CLIENT_URL || '').split(',').map((s: string) => s.trim()).filter(Boolean);
    const allowedOrigins = [
      ...fromEnv,
      'http://localhost:3000',
      'http://localhost:5174'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Re-export auth middleware
export { protect, restrictTo, optionalAuth } from './auth';