import express from 'express';
import { getTables, createTable, getTableById, updateTable, deleteTable, regenerateQR, getTableQR } from '../controllers/tableController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, authorize('admin', 'superadmin', 'manager', 'waiter'), getTables)
    .post(protect, authorize('admin', 'superadmin', 'manager'), createTable);

router.route('/:id')
    .get(protect, authorize('admin', 'superadmin', 'manager', 'waiter'), getTableById)
    .put(protect, authorize('admin', 'superadmin', 'manager', 'waiter'), updateTable)
    .delete(protect, authorize('admin', 'superadmin', 'manager'), deleteTable);

router.get('/:id/qr', protect, authorize('admin', 'superadmin', 'manager'), getTableQR);
router.post('/:id/regenerate-qr', protect, authorize('admin', 'superadmin', 'manager'), regenerateQR);

export default router;
