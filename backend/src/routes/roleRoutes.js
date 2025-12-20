import express from 'express';
import { getRoles, createRole, updateRole, deleteRole } from '../controllers/roleController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, authorize('admin', 'superadmin'), getRoles)
    .post(protect, authorize('admin', 'superadmin'), createRole);

router.route('/:id')
    .put(protect, authorize('admin', 'superadmin'), updateRole)
    .delete(protect, authorize('admin', 'superadmin'), deleteRole);

export default router;
