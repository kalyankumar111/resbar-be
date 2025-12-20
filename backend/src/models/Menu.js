import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    price: {
        type: Number,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    image: {
        type: String,
    },
    isAvailable: {
        type: Boolean,
        default: true,
    },
});

const menuSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    items: [menuItemSchema],
}, {
    timestamps: true,
});

const Menu = mongoose.model('Menu', menuSchema);

export default Menu;
