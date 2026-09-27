import { Router } from 'express';
import * as wellnessController from '../controllers/wellnessController.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

router.get('/tips/today', wellnessController.getTodayTip);
router.get('/tips', wellnessController.listTips);

router.get('/water/today', requireAuth, requireRole('patient'), wellnessController.getTodayWater);
router.post('/water/log', requireAuth, requireRole('patient'), wellnessController.logWater);

router.get('/progress', requireAuth, requireRole('patient'), wellnessController.getMyProgress);
router.get('/nutrition', requireAuth, requireRole('patient'), wellnessController.getMyNutrition);

export default router;
