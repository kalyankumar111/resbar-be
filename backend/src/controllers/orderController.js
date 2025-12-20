import Order from '../models/Order.js';

// @desc    Get all orders
// @route   GET /api/orders
export const getOrders = async (req, res) => {
    const orders = await Order.find({}).populate('tableId createdBy');
    res.json(orders);
};

// @desc    Create an order
// @route   POST /api/orders
export const createOrder = async (req, res) => {
    const { tableId, items, totalAmount } = req.body;

    const order = new Order({
        tableId,
        createdBy: req.user._id,
        items,
        totalAmount,
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
export const getOrderById = async (req, res) => {
    const order = await Order.findById(req.params.id).populate('tableId createdBy');

    if (order) {
        res.json(order);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
export const updateOrderStatus = async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.status = req.body.status || order.status;
        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
export const cancelOrder = async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.status = 'cancelled';
        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
};
