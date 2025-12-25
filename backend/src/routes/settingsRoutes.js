import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getSettings)
    .put(protect, authorize('admin', 'superadmin', 'manager'), updateSettings);

export default router;
