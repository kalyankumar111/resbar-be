import Order from '../models/Order.js';
import Table from '../models/Table.js';
import Settings from '../models/Settings.js';

// @desc    Get all orders
// @route   GET /api/orders
export const getOrders = async (req, res) => {
    const orders = await Order.find({}).sort({ createdAt: -1 }).populate('tableId createdBy');
    res.json(orders);
};

// @desc    Create an order
// @route   POST /api/orders
export const createOrder = async (req, res) => {
    const { tableId, items, totalAmount, seatsAllocated } = req.body;

    try {
        // Get table to check capacity
        const table = await Table.findById(tableId);
        if (!table) {
            return res.status(404).json({ message: 'Table not found' });
        }

        // Get settings for extra seat price
        let settings = await Settings.findById('restaurant_settings');
        if (!settings) {
            settings = await Settings.create({
                _id: 'restaurant_settings',
                extraSeatPrice: 5.00,
            });
        }

        // Calculate extra seats charge
        let extraSeatsCharge = 0;
        const seats = seatsAllocated || table.capacity;

        if (seats > table.capacity) {
            const extraSeats = seats - table.capacity;
            extraSeatsCharge = extraSeats * settings.extraSeatPrice;
        }

        // Calculate final total
        const finalTotal = totalAmount + extraSeatsCharge;

        const order = new Order({
            tableId,
            createdBy: req.user._id,
            items,
            totalAmount: finalTotal,
            seatsAllocated: seats,
            extraSeatsCharge,
        });

        const createdOrder = await order.save();
        res.status(201).json(createdOrder);
    } catch (error) {
        res.status(400).json({ message: 'Failed to create order', error: error.message });
    }
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
