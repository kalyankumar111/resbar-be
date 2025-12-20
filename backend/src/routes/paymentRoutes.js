import express from 'express';
import { initiatePayment, paymentWebhook, getPaymentByOrderId } from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/initiate', protect, initiatePayment);
router.post('/webhook', paymentWebhook); // Usually public but needs signature verif in production
router.get('/:order_id', protect, getPaymentByOrderId);

export default router;
