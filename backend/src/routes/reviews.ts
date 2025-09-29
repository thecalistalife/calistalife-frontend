import { Router } from 'express';
import multer from 'multer';
import { body, param, query } from 'express-validator';
import { handleValidationErrors, optionalAuth } from '@/middleware';
import { createReview, getReviews, getSummary, voteHelpfulness, uploadReviewImage } from '@/controllers/reviews';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 4 } });

// Summary for a product
router.get('/summary/:productId',
  param('productId').isUUID().withMessage('valid product id required'),
  handleValidationErrors,
  getSummary
);

// List reviews for a product
router.get('/:productId',
  param('productId').isUUID(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sort').optional().isIn(['newest', 'helpful']),
  query('photosOnly').optional().isBoolean(),
  query('verifiedOnly').optional().isBoolean(),
  query('minRating').optional().isInt({ min: 1, max: 5 }),
  query('fit').optional().isIn(['too_small', 'perfect', 'too_large']),
  handleValidationErrors,
  getReviews
);

// Create a review (auth optional)
router.post('/',
  optionalAuth,
  body('productId').isUUID(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('reviewText').isString().isLength({ min: 10 }),
  body('reviewerName').isString().isLength({ min: 2 }),
  body('reviewerEmail').isEmail(),
  body('reviewTitle').optional().isString().isLength({ max: 200 }),
  body('sizePurchased').optional().isString(),
  body('colorPurchased').optional().isString(),
  body('fitFeedback').optional().isIn(['too_small', 'perfect', 'too_large']),
  body('qualityRating').optional().isInt({ min: 1, max: 5 }),
  body('comfortRating').optional().isInt({ min: 1, max: 5 }),
  body('styleRating').optional().isInt({ min: 1, max: 5 }),
  handleValidationErrors,
  createReview
);

// Upload review image (returns URL)
router.post('/upload-image',
  optionalAuth,
  upload.array('images', 4),
  uploadReviewImage
);

// Mark helpful/unhelpful
router.post('/vote',
  optionalAuth,
  body('reviewId').isUUID(),
  body('isHelpful').isBoolean(),
  handleValidationErrors,
  voteHelpfulness
);

export default router;