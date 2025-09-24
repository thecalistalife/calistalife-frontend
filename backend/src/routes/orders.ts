import { Router } from 'express';
import { body } from 'express-validator';
import { optionalAuth, handleValidationErrors, protect } from '@/middleware';
import { createOrder, getMyOrders, getOrderById, getOrderByNumber } from '@/controllers/orders';

const router = Router();

// Allow guests or authenticated users to place orders
router.use(optionalAuth);

// Create order (after successful payment or to initiate Razorpay)
router.post(
  '/create',
  body('items').isArray({ min: 1 }).withMessage('Items are required'),
  body('totalAmount').isFloat({ gt: 0 }).withMessage('Total amount must be > 0'),
  handleValidationErrors,
  createOrder
);

// Authenticated order endpoints
router.use(protect);
router.get('/my', getMyOrders);
router.get('/by-number/:orderNumber', getOrderByNumber);
router.get('/:id', getOrderById);

export default router;
