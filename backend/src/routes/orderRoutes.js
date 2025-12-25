import express from 'express';
import { getOrders, createOrder, getOrderById, updateOrderStatus, cancelOrder, addItemsToOrder } from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, authorize('admin', 'superadmin', 'manager', 'waiter', 'chef'), getOrders)
    .post(protect, authorize('admin', 'superadmin', 'manager', 'waiter'), createOrder);

router.route('/:id')
    .get(protect, authorize('admin', 'superadmin', 'manager', 'waiter', 'chef'), getOrderById);

router.put('/:id/status', protect, authorize('admin', 'superadmin', 'manager', 'waiter', 'chef'), updateOrderStatus);
router.put('/:id/cancel', protect, authorize('admin', 'superadmin', 'manager', 'waiter'), cancelOrder);
router.patch('/:id/items', protect, authorize('admin', 'superadmin', 'manager', 'waiter'), addItemsToOrder);

export default router;
