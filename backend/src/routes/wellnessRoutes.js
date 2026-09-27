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

router.get('/sleep', requireAuth, requireRole('patient'), wellnessController.getSleepHistory);
router.post('/sleep/log', requireAuth, requireRole('patient'), wellnessController.logSleep);

router.get('/activity/today', requireAuth, requireRole('patient'), wellnessController.getTodayActivity);
router.get('/activity', requireAuth, requireRole('patient'), wellnessController.getActivityHistory);
router.post('/activity/log', requireAuth, requireRole('patient'), wellnessController.logActivity);

router.get('/weight', requireAuth, requireRole('patient'), wellnessController.getWeightHistory);
router.post('/weight/log', requireAuth, requireRole('patient'), wellnessController.logWeight);

export default router;
