import Order from '../models/Order.js';

// @desc    Get all orders
// @route   GET /api/orders
export const getOrders = async (req, res) => {
    const orders = await Order.find({}).sort({ createdAt: -1 }).populate('tableId createdBy');
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

        // Mark all items as well if status is served or paid
        if (['served', 'paid', 'cancelled'].includes(req.body.status)) {
            order.items.forEach(item => {
                item.status = req.body.status;
            });
        }

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
// @desc    Add items to an existing order
// @route   PATCH /api/orders/:id/items
export const addItemsToOrder = async (req, res) => {
    const { items } = req.body;
    const order = await Order.findById(req.params.id);

    if (order) {
        // Add new items
        order.items.push(...items.map(item => ({
            ...item,
            status: 'pending',
            firedAt: Date.now()
        })));

        // Update total amount
        const additionalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        order.totalAmount += additionalAmount;

        // If order was ready/served, it might need to go back to preparing/pending
        // The kitchen logic handles this on save if we use the same field update, 
        // but let's ensure the order status is corrected if it was finalized.
        if (['ready', 'served'].includes(order.status)) {
            order.status = 'preparing';
        }

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
};
