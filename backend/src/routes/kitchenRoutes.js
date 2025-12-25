import express from 'express';
import { getKitchenOrders, updateKitchenOrderStatus, updateKitchenItemStatus, reorderKitchenItem } from '../controllers/kitchenController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin', 'superadmin', 'chef', 'manager'));

router.get('/orders', getKitchenOrders);
router.put('/orders/:id/status', updateKitchenOrderStatus);
router.put('/orders/:id/items/:itemId/status', updateKitchenItemStatus);
router.post('/orders/:id/items/:itemId/reorder', reorderKitchenItem);

export default router;
