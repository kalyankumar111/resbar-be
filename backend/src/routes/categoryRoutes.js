import express from 'express';
import Category from '../models/Category.js';

const router = express.Router();

// @desc    Get all categories
// @route   GET /api/categories
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find({});
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a category
// @route   POST /api/categories
router.post('/', async (req, res) => {
    try {
        const { name, description } = req.body;
        const category = new Category({ name, description });
        const createdCategory = await category.save();
        res.status(201).json(createdCategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

export default router;
