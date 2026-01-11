import Settings from '../models/Settings.js';

// @desc    Get restaurant settings
// @route   GET /api/settings
export const getSettings = async (req, res) => {
    try {
        let settings = await Settings.findById('restaurant_settings');

        // Create default settings if none exist
        if (!settings) {
            settings = await Settings.create({
                _id: 'restaurant_settings',
                restaurantName: 'Antigravity Bistro',
                extraSeatPrice: 5.00,
                taxRate: 10,
                serviceChargeRate: 0,
                currency: 'USD',
            });
        }

        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch settings', error: error.message });
    }
};

// @desc    Update restaurant settings
// @route   PUT /api/settings
export const updateSettings = async (req, res) => {
    try {
        const {
            restaurantName,
            extraSeatPrice,
            taxRate,
            serviceChargeRate,
            currency,
        } = req.body;

        let settings = await Settings.findById('restaurant_settings');

        if (!settings) {
            settings = await Settings.create({
                _id: 'restaurant_settings',
                restaurantName,
                extraSeatPrice,
                taxRate,
                serviceChargeRate,
                currency,
            });
        } else {
            if (restaurantName !== undefined) settings.restaurantName = restaurantName;
            if (extraSeatPrice !== undefined) settings.extraSeatPrice = extraSeatPrice;
            if (taxRate !== undefined) settings.taxRate = taxRate;
            if (serviceChargeRate !== undefined) settings.serviceChargeRate = serviceChargeRate;
            if (currency !== undefined) settings.currency = currency;

            await settings.save();
        }

        res.json(settings);
    } catch (error) {
        res.status(400).json({ message: 'Failed to update settings', error: error.message });
    }
};
