import { Router } from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { validate } from '../middlewares/validate.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { createOrderSchema, verifyPaymentSchema } from '../validators/paymentValidators.js';

const router = Router();

router.post('/orders', requireAuth, requireRole('patient'), validate(createOrderSchema), paymentController.createOrder);
router.post('/verify', requireAuth, requireRole('patient'), validate(verifyPaymentSchema), paymentController.verifyPayment);

// Note: POST /webhook is registered directly in app.js (ahead of express.json()) so it can
// verify Razorpay's HMAC signature against the raw request body — it is not defined here.

export default router;
