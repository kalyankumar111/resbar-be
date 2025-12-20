import express from 'express';
import { authUser, getUserProfile, logoutUser, refreshToken } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', authUser);
router.post('/logout', protect, logoutUser);
router.post('/refresh', refreshToken);
router.get('/me', protect, getUserProfile);

export default router;
