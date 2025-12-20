import express from 'express';
import { validateTable, getPublicMenu, createPublicOrder } from '../controllers/publicController.js';

const router = express.Router();

router.get('/table/:qr_token/validate', validateTable);
router.get('/table/:qr_token/menu', getPublicMenu);
router.post('/table/:qr_token/order', createPublicOrder);

export default router;
