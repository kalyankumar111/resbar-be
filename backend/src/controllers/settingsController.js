// This is a placeholder for settings. In a real app, this might be stored in a separate 'Settings' model.

let mockSettings = {
    restaurantName: 'Antigravity Bistro',
    currency: 'USD',
    taxRate: 0.1,
};

// @desc    Get all settings
// @route   GET /api/settings
export const getSettings = async (req, res) => {
    res.json(mockSettings);
};

// @desc    Update settings
// @route   PUT /api/settings
export const updateSettings = async (req, res) => {
    mockSettings = { ...mockSettings, ...req.body };
    res.json(mockSettings);
};
