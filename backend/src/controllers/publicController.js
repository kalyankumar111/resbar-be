import Table from '../models/Table.js';
import Menu from '../models/Menu.js';
import Order from '../models/Order.js';

// @desc    Validate QR token
// @route   GET /api/public/table/:qr_token/validate
// @access  Public
export const validateTable = async (req, res) => {
    const table = await Table.findOne({ qrToken: req.params.qr_token, isActive: true });

    if (table) {
        res.json({ valid: true, tableNumber: table.tableNumber });
    } else {
        res.status(404).json({ valid: false, message: 'Invalid or inactive QR code' });
    }
};

// @desc    Get menu for table
// @route   GET /api/public/table/:qr_token/menu
// @access  Public
export const getPublicMenu = async (req, res) => {
    const table = await Table.findOne({ qrToken: req.params.qr_token, isActive: true });

    if (table) {
        const menus = await Menu.find({ isActive: true });
        res.json(menus);
    } else {
        res.status(404).json({ message: 'Invalid or inactive QR code' });
    }
};

// @desc    Create order from table
// @route   POST /api/public/table/:qr_token/order
// @access  Public
export const createPublicOrder = async (req, res) => {
    const table = await Table.findOne({ qrToken: req.params.qr_token, isActive: true });

    if (table) {
        const { items, totalAmount } = req.body;
        // Note: For public orders, we might need a system user or handle 'createdBy' differently.
        // Setting createdBy to a placeholder or null if allowed, but schema says required.
        // For now, let's assume there's a 'system' user or require a waiter to approve.
        // Implementation-wise, let's just use a placeholder ID or find an admin user.
        res.status(501).json({ message: 'Order creation from public routes needs a system user strategy' });
    } else {
        res.status(404).json({ message: 'Invalid or inactive QR code' });
    }
};
