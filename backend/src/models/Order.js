import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    price: { type: Number, required: true },
    menuItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Menu.items',
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'preparing', 'ready', 'served', 'paid', 'cancelled'],
        default: 'pending',
    },
    firedAt: {
        type: Date,
        default: Date.now,
    },
});

const orderSchema = new mongoose.Schema({
    tableId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Table',
        required: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'preparing', 'ready', 'served', 'paid', 'cancelled'],
        default: 'pending',
    },
    totalAmount: {
        type: Number,
        required: true,
        default: 0.0,
    },
    seatsAllocated: {
        type: Number,
        default: 0,
    },
    extraSeatsCharge: {
        type: Number,
        default: 0.0,
    },
    items: [orderItemSchema],
}, {
    timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
