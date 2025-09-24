import { Router } from 'express';
import { body } from 'express-validator';
import { optionalAuth, handleValidationErrors } from '@/middleware';
import { createOrder } from '@/controllers/orders';

const router = Router();

// Allow guests or authenticated users to place orders
router.use(optionalAuth);

// Create order (after successful payment)
router.post(
  '/create',
  body('items').isArray({ min: 1 }).withMessage('Items are required'),
  body('totalAmount').isFloat({ gt: 0 }).withMessage('Total amount must be > 0'),
  handleValidationErrors,
  createOrder
);

export default router;
