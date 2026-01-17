import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
    restaurantName: {
        type: String,
        default: 'My Restaurant',
    },
    extraSeatPrice: {
        type: Number,
        default: 5.00,
        min: 0,
    },
    taxRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    serviceChargeRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    currency: {
        type: String,
        default: 'INR',
    },
    // Singleton pattern - only one settings document
    _id: {
        type: String,
        default: 'restaurant_settings',
    },
}, {
    timestamps: true,
});

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
