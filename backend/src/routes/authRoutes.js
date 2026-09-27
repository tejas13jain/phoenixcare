import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { validate } from '../middlewares/validate.js';
import { requireAuth } from '../middlewares/auth.js';
import { authLimiter, otpLimiter } from '../middlewares/rateLimiters.js';
import {
  signupSchema,
  loginSchema,
  requestOtpSchema,
  verifyOtpSchema,
  refreshSchema,
} from '../validators/authValidators.js';

const router = Router();

/**
 * @openapi
 * /auth/signup:
 *   post:
 *     summary: Create a patient or doctor account
 *     tags: [Auth]
 */
router.post('/signup', authLimiter, validate(signupSchema), authController.signup);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Log in with email/phone + password
 *     tags: [Auth]
 */
router.post('/login', authLimiter, validate(loginSchema), authController.login);

/**
 * @openapi
 * /auth/otp/request:
 *   post:
 *     summary: Request a one-time password via SMS/WhatsApp/email
 *     tags: [Auth]
 */
router.post('/otp/request', otpLimiter, validate(requestOtpSchema), authController.requestOtp);

/**
 * @openapi
 * /auth/otp/verify:
 *   post:
 *     summary: Verify OTP and log in (or complete signup verification)
 *     tags: [Auth]
 */
router.post('/otp/verify', otpLimiter, validate(verifyOtpSchema), authController.verifyOtpAndLogin);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Exchange a refresh token for a new access/refresh token pair
 *     tags: [Auth]
 */
router.post('/refresh', validate(refreshSchema), authController.refresh);

router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.me);

export default router;
