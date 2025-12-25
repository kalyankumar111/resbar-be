import express from 'express';
import {
    getCategories, createCategory, updateCategory, deleteCategory,
    getItems, createItem, updateItem, deleteItem, toggleAvailability
} from '../controllers/menuController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Categories
router.route('/categories')
    .get(getCategories)
    .post(protect, authorize('admin', 'superadmin', 'manager'), createCategory);

router.route('/categories/:id')
    .put(protect, authorize('admin', 'superadmin', 'manager'), updateCategory)
    .delete(protect, authorize('admin', 'superadmin', 'manager'), deleteCategory);

// Items
router.route('/items')
    .get(getItems)
    .post(protect, authorize('admin', 'superadmin', 'manager'), createItem);

router.route('/items/:id')
    .put(protect, authorize('admin', 'superadmin', 'manager'), updateItem)
    .delete(protect, authorize('admin', 'superadmin', 'manager'), deleteItem);

router.put('/items/:id/availability', protect, authorize('admin', 'superadmin', 'manager'), toggleAvailability);

export default router;
