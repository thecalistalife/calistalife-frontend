import { Router } from 'express'
import { adminLoginLimiter, login, verify2fa, setup2faStart, setup2faVerify, logout, getSession, lockdown } from '@/controllers/adminAuth'
import { requireAdmin } from '@/middleware/admin'
import { listAdmins, createAdmin, setAdminActive } from '@/controllers/adminUsers'
import adminProducts from './adminProducts'
import adminMedia from './adminMedia'
import adminVariants from './adminVariants'
import adminCategories from './adminCategories'
import adminCollections from './adminCollections'

const router = Router()

// Root of secret admin should look like 404 if accessed directly
router.get('/', (req, res) => res.status(404).json({ success: false, message: 'Not found' }))

// Auth
router.post('/auth/login', adminLoginLimiter, login)
router.post('/auth/verify-2fa', verify2fa)
router.post('/auth/logout', logout)
router.get('/auth/session', getSession)

// 2FA setup (requires admin session)
router.post('/auth/2fa/start', requireAdmin, setup2faStart)
router.post('/auth/2fa/verify', requireAdmin, setup2faVerify)

// Emergency lockdown (master)
router.post('/lockdown', requireAdmin, lockdown)

// Admin user management (master only)
router.get('/users', requireAdmin, listAdmins)
router.post('/users', requireAdmin, createAdmin)
router.patch('/users/:id', requireAdmin, setAdminActive)

// Products management
router.use('/products', adminProducts)
// Media management (images)
router.use('/media', adminMedia)
// Variants management
router.use('/variants', adminVariants)
// Categories management
router.use('/categories', adminCategories)
// Collections management
router.use('/collections', adminCollections)

// Orders management
import adminOrders from './adminOrders'
router.use('/orders', adminOrders)

// Reviews management
import adminReviews from './adminReviews'
router.use('/reviews', adminReviews)

// Example protected endpoint
router.get('/dashboard', requireAdmin, (req, res) => res.status(200).json({ success: true, message: 'Admin OK' }))

export default router
