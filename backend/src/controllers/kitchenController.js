import Order from '../models/Order.js';
import mongoose from 'mongoose';

// @desc    Get active/kitchen orders (preparing, ready, etc)
// @route   GET /api/kitchen/orders
export const getKitchenOrders = async (req, res) => {
    const { history } = req.query;
    const statuses = history === 'true'
        ? ['served', 'paid', 'cancelled']
        : ['pending', 'preparing', 'ready'];

    const orders = await Order.find({
        status: { $in: statuses }
    }).sort({ createdAt: history === 'true' ? -1 : 1 }).populate('tableId');
    res.json(orders);
};

// @desc    Update kitchen order status
// @route   PUT /api/kitchen/orders/:id/status
export const updateKitchenOrderStatus = async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.status = req.body.status || order.status;

        // If order status is updated, we might want to update all items too
        // but often it's the other way around. Let's keep it simple for now.
        if (req.body.updateItems) {
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

// @desc    Update individual item status in an order
export const updateKitchenItemStatus = async (req, res) => {
    const { id, itemId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);

    if (order) {
        const item = order.items.id(itemId);
        if (item) {
            item.status = status;

            // Recompute order status based on all items
            const itemStatuses = order.items.map(i => i.status);

            const allServed = itemStatuses.every(s => s === 'served' || s === 'cancelled');
            const allReadyOrServed = itemStatuses.every(s => s === 'ready' || s === 'served' || s === 'cancelled');
            const anyPreparing = itemStatuses.some(s => s === 'preparing');
            const allCancelled = itemStatuses.every(s => s === 'cancelled');

            if (allCancelled) {
                order.status = 'cancelled';
            } else if (allServed) {
                order.status = 'served';
            } else if (allReadyOrServed) {
                order.status = 'ready';
            } else if (anyPreparing) {
                order.status = 'preparing';
            } else {
                order.status = 'pending';
            }

            await order.save();
            res.json(order);
        } else {
            res.status(404).json({ message: 'Item not found in order' });
        }
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
};

// @desc    Re-fire/Re-order an item (add as new pending item)
// @route   POST /api/kitchen/orders/:id/items/:itemId/reorder
export const reorderKitchenItem = async (req, res) => {
    const { id, itemId } = req.params;

    const order = await Order.findById(id);

    if (order) {
        const item = order.items.id(itemId);
        if (item) {
            // Add a new entry for the same item
            order.items.push({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                menuItemId: item.menuItemId,
                status: 'pending'
            });

            // If it was ready/preparing, order might need to be pending again if we just added a new task
            order.status = 'preparing'; // At least one item is now in progress/needs attention

            await order.save();
            res.json(order);
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
};
