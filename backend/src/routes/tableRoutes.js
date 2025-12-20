import express from 'express';
import { getTables, createTable, getTableById, updateTable, deleteTable, regenerateQR, getTableQR } from '../controllers/tableController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, authorize('admin', 'manager'), getTables)
    .post(protect, authorize('admin', 'manager'), createTable);

router.route('/:id')
    .get(protect, authorize('admin', 'manager'), getTableById)
    .put(protect, authorize('admin', 'manager'), updateTable)
    .delete(protect, authorize('admin', 'manager'), deleteTable);

router.get('/:id/qr', protect, authorize('admin', 'manager'), getTableQR);
router.post('/:id/regenerate-qr', protect, authorize('admin', 'manager'), regenerateQR);

export default router;
