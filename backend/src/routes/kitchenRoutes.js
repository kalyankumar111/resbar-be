import express from 'express';
import { getKitchenOrders, updateKitchenOrderStatus } from '../controllers/kitchenController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin', 'superadmin', 'chef', 'manager'));

router.get('/orders', getKitchenOrders);
router.put('/orders/:id/status', updateKitchenOrderStatus);

export default router;
