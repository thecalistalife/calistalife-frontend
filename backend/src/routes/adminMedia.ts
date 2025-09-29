import { Router } from 'express'
import { requireAdmin } from '@/middleware/admin'
import { mediaUpload, listImages, updateImageMeta, deleteImage } from '@/controllers/adminMedia'

const router = Router()

router.use(requireAdmin)
router.post('/upload', ...mediaUpload)
router.get('/list', listImages)
router.patch('/:id', updateImageMeta)
router.delete('/:id', deleteImage)

export default router
