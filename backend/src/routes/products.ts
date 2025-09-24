import { Router } from 'express';
import {
  getProducts,
  getProduct,
  getFeaturedProducts,
  getNewArrivals,
  getBestSellers,
  getProductsByCategory,
  getCollections,
  getFilterOptions,
  getSearchSuggestions
} from '@/controllers/products';
import { optionalAuth } from '@/middleware';

const router = Router();

// Public routes
router.get('/', optionalAuth, getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/best-sellers', getBestSellers);
router.get('/collections', getCollections);
router.get('/filters', getFilterOptions);
router.get('/search/suggestions', getSearchSuggestions);
router.get('/category/:category', getProductsByCategory);
router.get('/:id', getProduct); // This should be last to avoid conflicts

export default router;