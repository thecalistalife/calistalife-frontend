import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  addAddress,
  updateAddress,
  deleteAddress,
  refreshToken,
  forgotPassword,
  resetPassword,
  requestEmailVerification,
  verifyEmail,
  googleLogin
} from '@/controllers/auth';
import { protect, handleValidationErrors, authRateLimit } from '@/middleware';

const router = Router();

// Validation rules
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Token is required'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

const verifyEmailValidation = [
  body('token').notEmpty().withMessage('Token is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required')
];

const googleLoginValidation = [
  body('idToken').notEmpty().withMessage('Google idToken is required')
];

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please provide a valid phone number')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

const addressValidation = [
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must not exceed 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must not exceed 50 characters'),
  body('address1')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Address is required and must not exceed 100 characters'),
  body('city')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('City is required and must not exceed 50 characters'),
  body('state')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('State is required and must not exceed 50 characters'),
  body('zipCode')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('ZIP code is required and must be between 3 and 20 characters'),
  body('country')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Country is required and must not exceed 50 characters')
];

// Public routes (with rate limiting)
router.post('/register', authRateLimit, registerValidation, handleValidationErrors, register);
router.post('/login', authRateLimit, loginValidation, handleValidationErrors, login);
router.post('/logout', logout);

// Token refresh
router.post('/refresh', refreshToken);

// Password reset (public)
router.post('/password/forgot', authRateLimit, forgotPasswordValidation, handleValidationErrors, forgotPassword);
router.post('/password/reset', authRateLimit, resetPasswordValidation, handleValidationErrors, resetPassword);

// Email verification confirm (public)
router.post('/verify/confirm', verifyEmailValidation, handleValidationErrors, verifyEmail);

// Google login (public)
router.post('/google', googleLoginValidation, handleValidationErrors, googleLogin);

// Protected routes (after public auth routes above)
router.use(protect);

// Email verification request (protected)
router.post('/verify/request', requestEmailVerification);

router.get('/me', getMe);
router.put('/profile', updateProfileValidation, handleValidationErrors, updateProfile);
router.put('/password', changePasswordValidation, handleValidationErrors, changePassword);

// Address management
router.post('/addresses', addressValidation, handleValidationErrors, addAddress);
router.put('/addresses/:addressId', addressValidation, handleValidationErrors, updateAddress);
router.delete('/addresses/:addressId', deleteAddress);

export default router;