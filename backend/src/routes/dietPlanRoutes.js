import { Router } from 'express';
import * as dietPlanController from '../controllers/dietPlanController.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createDietPlanSchema, updateDietPlanSchema, dietPlanIdSchema } from '../validators/dietPlanValidators.js';

const router = Router();

router.get('/mine', requireAuth, requireRole('doctor'), dietPlanController.listMyDietPlansAsDoctor);
router.get('/patient/mine', requireAuth, requireRole('patient'), dietPlanController.listMyDietPlansAsPatient);

router.post('/', requireAuth, requireRole('doctor'), validate(createDietPlanSchema), dietPlanController.createDietPlan);
router.patch(
  '/:id',
  requireAuth,
  requireRole('doctor'),
  validate(updateDietPlanSchema),
  dietPlanController.updateDietPlan
);
router.delete(
  '/:id',
  requireAuth,
  requireRole('doctor'),
  validate(dietPlanIdSchema),
  dietPlanController.deleteDietPlan
);
router.get('/:id', requireAuth, validate(dietPlanIdSchema), dietPlanController.getDietPlanById);

export default router;
