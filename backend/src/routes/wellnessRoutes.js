import { Router } from 'express';
import * as wellnessController from '../controllers/wellnessController.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { logVitalsSchema, logMoodSchema, setGoalSchema } from '../validators/wellnessValidators.js';

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

router.get('/workouts', requireAuth, requireRole('patient'), wellnessController.getMyWorkouts);

router.get('/goals', requireAuth, requireRole('patient'), wellnessController.getMyGoals);
router.put('/goals/:type', requireAuth, requireRole('patient'), validate(setGoalSchema), wellnessController.setGoal);

router.get('/vitals', requireAuth, requireRole('patient'), wellnessController.getVitalsHistory);
router.post('/vitals/log', requireAuth, requireRole('patient'), validate(logVitalsSchema), wellnessController.logVitals);

router.get('/mood', requireAuth, requireRole('patient'), wellnessController.getMoodHistory);
router.post('/mood/log', requireAuth, requireRole('patient'), validate(logMoodSchema), wellnessController.logMood);

router.get('/report', requireAuth, requireRole('patient'), wellnessController.getMyHealthReport);

export default router;
