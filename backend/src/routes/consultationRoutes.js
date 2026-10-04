import { requireDoctorTerms } from '../middlewares/requireDoctorTerms.js';
import { Router } from 'express';
import * as consultationController from '../controllers/consultationController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/:appointmentId/room', requireDoctorTerms, consultationController.getRoomInfo);
router.get('/:appointmentId/messages', consultationController.getChatHistory);

export default router;
