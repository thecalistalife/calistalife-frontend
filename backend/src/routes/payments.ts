import express, { Router } from 'express';
import { body } from 'express-validator';
import { createPaymentIntent, handleStripeWebhook, createRazorpayOrder, handleRazorpayWebhook } from '../controllers/payments';
import { handleValidationErrors, optionalAuth } from '../middleware';

const router = Router();

// Stripe webhook (no auth required) - requires raw body for signature verification
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// Razorpay webhook (no auth required) - requires raw body for signature verification
router.post('/razorpay/webhook', express.raw({ type: 'application/json' }), handleRazorpayWebhook);

// Create payment intent (optional auth - can be used by guests or authenticated users)
const createIntentValidation = [
  body('amount').isInt({ min: 50 }).withMessage('Amount (in cents) must be >= 50'),
  body('currency').optional().isString().isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter code'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object'),
];

router.post('/intent', optionalAuth, createIntentValidation, handleValidationErrors, createPaymentIntent);

// Razorpay order creation (amount in paise)
router.post('/razorpay/order', optionalAuth, body('amount').isInt({ min: 100 }).withMessage('Amount in paise must be >= 100'), handleValidationErrors, createRazorpayOrder);

export default router;
