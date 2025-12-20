import Payment from '../models/Payment.js';
import Order from '../models/Order.js';

// @desc    Initiate payment
// @route   POST /api/payments/initiate
export const initiatePayment = async (req, res) => {
    const { orderId, method, amount } = req.body;

    const order = await Order.findById(orderId);

    if (order) {
        const payment = await Payment.create({
            orderId,
            method,
            amount,
            status: 'pending',
        });
        res.status(201).json(payment);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
};

// @desc    Payment webhook (simulate from provider)
// @route   POST /api/payments/webhook
export const paymentWebhook = async (req, res) => {
    const { orderId, status, transactionRef } = req.body;

    const payment = await Payment.findOne({ orderId });

    if (payment) {
        payment.status = status || payment.status;
        payment.transactionRef = transactionRef || payment.transactionRef;
        await payment.save();

        if (status === 'completed') {
            const order = await Order.findById(orderId);
            if (order) {
                order.status = 'paid';
                await order.save();
            }
        }

        res.json({ message: 'Payment status updated' });
    } else {
        res.status(404).json({ message: 'Payment not found' });
    }
};

// @desc    Get payment by order ID
// @route   GET /api/payments/:order_id
export const getPaymentByOrderId = async (req, res) => {
    const payment = await Payment.findOne({ orderId: req.params.order_id });

    if (payment) {
        res.json(payment);
    } else {
        res.status(404).json({ message: 'Payment not found' });
    }
};
