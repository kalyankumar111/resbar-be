import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import Table from '../models/Table.js';

// @desc    Get sales reports
// @route   GET /api/reports/sales
export const getSalesReports = async (req, res) => {
    const completedPayments = await Payment.find({ status: 'completed' });
    const totalSales = completedPayments.reduce((acc, curr) => acc + curr.amount, 0);
    res.json({ totalSales, count: completedPayments.length });
};

// @desc    Get order reports
// @route   GET /api/reports/orders
export const getOrderReports = async (req, res) => {
    const totalOrders = await Order.countDocuments({});
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const servedOrders = await Order.countDocuments({ status: 'served' });
    res.json({ totalOrders, pendingOrders, servedOrders });
};

// @desc    Get table reports
// @route   GET /api/reports/tables
export const getTableReports = async (req, res) => {
    const totalTables = await Table.countDocuments({});
    const activeTables = await Table.countDocuments({ isActive: true });
    res.json({ totalTables, activeTables });
};
