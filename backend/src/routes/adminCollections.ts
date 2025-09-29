import { Router } from 'express'
import { requireAdmin } from '@/middleware/admin'
import { listCollections, createCollection, getCollection, updateCollection, deleteCollection, addProductsToCollection, removeProductFromCollection, reorderCollectionProducts, assignCollections } from '@/controllers/adminCollections'

const router = Router()

router.use(requireAdmin)
router.get('/', listCollections)
router.post('/', createCollection)
router.get('/:id', getCollection)
router.put('/:id', updateCollection)
router.delete('/:id', deleteCollection)
router.post('/:id/products', addProductsToCollection)
router.delete('/:id/products/:productId', removeProductFromCollection)
router.post('/:id/reorder', reorderCollectionProducts)
router.post('/assign', assignCollections)

export default router
