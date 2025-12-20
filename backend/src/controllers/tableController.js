import Table from '../models/Table.js';
import crypto from 'crypto';
import { generateQRCode } from '../utils/qrGenerator.js';

// @desc    Get all tables
// @route   GET /api/tables
// @access  Private/Admin
export const getTables = async (req, res) => {
    const tables = await Table.find({});
    res.json(tables);
};

// @desc    Create a table
// @route   POST /api/tables
// @access  Private/Admin
export const createTable = async (req, res) => {
    const { tableNumber } = req.body;

    const tableExists = await Table.findOne({ tableNumber });

    if (tableExists) {
        res.status(400).json({ message: 'Table already exists' });
    } else {
        // Generate initial QR token
        const qrToken = crypto.randomBytes(16).toString('hex');
        const table = await Table.create({ tableNumber, qrToken });
        res.status(201).json(table);
    }
};

// @desc    Get table by ID
// @route   GET /api/tables/:id
// @access  Private/Admin
export const getTableById = async (req, res) => {
    const table = await Table.findById(req.params.id);

    if (table) {
        res.json(table);
    } else {
        res.status(404).json({ message: 'Table not found' });
    }
};

// @desc    Update a table
// @route   PUT /api/tables/:id
// @access  Private/Admin
export const updateTable = async (req, res) => {
    const table = await Table.findById(req.params.id);

    if (table) {
        table.tableNumber = req.body.tableNumber || table.tableNumber;
        table.isActive = req.body.isActive !== undefined ? req.body.isActive : table.isActive;

        const updatedTable = await table.save();
        res.json(updatedTable);
    } else {
        res.status(404).json({ message: 'Table not found' });
    }
};

// @desc    Delete a table
// @route   DELETE /api/tables/:id
// @access  Private/Admin
export const deleteTable = async (req, res) => {
    const table = await Table.findById(req.params.id);

    if (table) {
        await table.deleteOne();
        res.json({ message: 'Table removed' });
    } else {
        res.status(404).json({ message: 'Table not found' });
    }
};

// @desc    Regenerate QR token
// @route   POST /api/tables/:id/regenerate-qr
// @access  Private/Admin
export const regenerateQR = async (req, res) => {
    const table = await Table.findById(req.params.id);

    if (table) {
        table.qrToken = crypto.randomBytes(16).toString('hex');
        const updatedTable = await table.save();
        res.json(updatedTable);
    } else {
        res.status(404).json({ message: 'Table not found' });
    }
};

// @desc    Get table QR code image
// @route   GET /api/tables/:id/qr
// @access  Private/Admin
export const getTableQR = async (req, res) => {
    const table = await Table.findById(req.params.id);

    if (table) {
        try {
            const qrImage = await generateQRCode(table.qrToken);
            res.json({
                tableNumber: table.tableNumber,
                qrCode: qrImage, // This is the Base64 image
            });
        } catch (error) {
            res.status(500).json({ message: 'Error generating QR code' });
        }
    } else {
        res.status(404).json({ message: 'Table not found' });
    }
};
