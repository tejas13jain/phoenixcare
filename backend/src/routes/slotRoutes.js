import { requireDoctorTerms } from '../middlewares/requireDoctorTerms.js';
import { Router } from 'express';
import * as slotController from '../controllers/slotController.js';
import { validate } from '../middlewares/validate.js';
import { requireAuth, requireRole, attachUserIfPresent } from '../middlewares/auth.js';
import { resolveDoctorParam, requireDoctorOwnership } from '../middlewares/resolveDoctor.js';
import { listSlotsSchema, generateSlotsSchema, slotIdParamSchema } from '../validators/slotValidators.js';

const router = Router({ mergeParams: true });

router.use(attachUserIfPresent, resolveDoctorParam);

/**
 * @openapi
 * /doctors/{doctorId}/slots:
 *   get:
 *     summary: List a doctor's slots (available-only for patients; all statuses for the owning doctor/admin)
 *     tags: [Booking]
 */
router.get('/', validate(listSlotsSchema), slotController.listSlots);

router.post(
  '/generate',
  requireAuth,
  requireRole('doctor', 'admin'),
  requireDoctorTerms,
  requireDoctorOwnership,
  validate(generateSlotsSchema),
  slotController.generateSlots
);

router.patch(
  '/:slotId',
  requireAuth,
  requireRole('doctor', 'admin'),
  requireDoctorTerms,
  requireDoctorOwnership,
  validate(slotIdParamSchema),
  slotController.updateSlotStatus
);

router.delete(
  '/:slotId',
  requireAuth,
  requireRole('doctor', 'admin'),
  requireDoctorTerms,
  requireDoctorOwnership,
  validate(slotIdParamSchema),
  slotController.deleteSlot
);

export default router;
