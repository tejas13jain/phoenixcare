import { Router } from 'express';
import * as patientController from '../controllers/patientController.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth, requireRole('patient'));

router.get('/me', patientController.getMyProfile);
router.patch('/me', patientController.updateMyProfile);

export default router;
