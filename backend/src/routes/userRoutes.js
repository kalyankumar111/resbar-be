import express from 'express';
import { getUsers, createUser, getUserById, updateUser, deleteUser } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, authorize('admin', 'superadmin'), getUsers)
    .post(protect, authorize('admin', 'superadmin'), createUser);

router.route('/:id')
    .get(protect, authorize('admin', 'superadmin'), getUserById)
    .put(protect, authorize('admin', 'superadmin'), updateUser)
    .delete(protect, authorize('admin', 'superadmin'), deleteUser);

export default router;
