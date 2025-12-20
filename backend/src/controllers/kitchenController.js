import Order from '../models/Order.js';

// @desc    Get active/kitchen orders (preparing, ready, etc)
// @route   GET /api/kitchen/orders
export const getKitchenOrders = async (req, res) => {
    const orders = await Order.find({
        status: { $in: ['pending', 'preparing', 'ready'] }
    }).populate('tableId');
    res.json(orders);
};

// @desc    Update kitchen order status
// @route   PUT /api/kitchen/orders/:id/status
export const updateKitchenOrderStatus = async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.status = req.body.status || order.status;
        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
};
