import { Router } from 'express';
import * as pushController from '../controllers/pushController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.get('/public-key', pushController.getPublicKey);
router.post('/subscribe', requireAuth, pushController.subscribe);
router.post('/unsubscribe', requireAuth, pushController.unsubscribe);

export default router;
