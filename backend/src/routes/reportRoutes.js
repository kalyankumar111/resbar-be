import express from 'express';
import { getSalesReports, getOrderReports, getTableReports } from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin', 'superadmin', 'manager'));

router.get('/sales', getSalesReports);
router.get('/orders', getOrderReports);
router.get('/tables', getTableReports);

export default router;
