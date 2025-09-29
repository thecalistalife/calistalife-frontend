import { Router } from 'express';
import { requireAdmin } from '@/middleware/admin';
import { listOrders, getOrder, updateOrder } from '@/controllers/adminOrders';

const router = Router();

router.use(requireAdmin);
router.get('/', listOrders);
router.get('/:id', getOrder);
router.patch('/:id', updateOrder);

export default router;