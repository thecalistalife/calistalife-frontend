import { Router } from 'express';
import { body } from 'express-validator';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  toggleWishlistItem
} from '@/controllers/cart';
import { protect, handleValidationErrors } from '@/middleware';

const router = Router();

// Validation rules (generic string IDs; Supabase may use UUID or text)
const addToCartValidation = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required'),
  body('size')
    .notEmpty()
    .withMessage('Size is required'),
  body('color')
    .notEmpty()
    .withMessage('Color is required'),
  body('quantity')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Quantity must be between 1 and 10')
];

const updateCartValidation = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required'),
  body('size')
    .notEmpty()
    .withMessage('Size is required'),
  body('color')
    .notEmpty()
    .withMessage('Color is required'),
  body('quantity')
    .isInt({ min: 1, max: 10 })
    .withMessage('Quantity must be between 1 and 10')
];

const removeFromCartValidation = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required'),
  body('size')
    .notEmpty()
    .withMessage('Size is required'),
  body('color')
    .notEmpty()
    .withMessage('Color is required')
];

const wishlistValidation = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
];

// All routes require authentication
router.use(protect);

// Cart routes
router.get('/', getCart);
router.post('/add', addToCartValidation, handleValidationErrors, addToCart);
router.put('/update', updateCartValidation, handleValidationErrors, updateCartItem);
router.delete('/remove', removeFromCartValidation, handleValidationErrors, removeFromCart);
router.delete('/clear', clearCart);

// Wishlist routes
router.get('/wishlist', getWishlist);
router.post('/wishlist/add', wishlistValidation, handleValidationErrors, addToWishlist);
router.delete('/wishlist/remove', wishlistValidation, handleValidationErrors, removeFromWishlist);
router.post('/wishlist/toggle', wishlistValidation, handleValidationErrors, toggleWishlistItem);

export default router;
