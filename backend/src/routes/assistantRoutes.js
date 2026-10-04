import { Router } from 'express';
import * as assistantController from '../controllers/assistantController.js';
import { assistantLimiter } from '../middlewares/rateLimiters.js';
import { validate } from '../middlewares/validate.js';
import { chatSchema } from '../validators/assistantValidators.js';

const router = Router();

router.get('/status', assistantController.getStatus);
router.post('/chat', assistantLimiter, validate(chatSchema), assistantController.chat);

export default router;
