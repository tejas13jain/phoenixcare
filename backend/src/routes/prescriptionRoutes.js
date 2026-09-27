import { Router } from 'express';
import * as prescriptionController from '../controllers/prescriptionController.js';
import { validate } from '../middlewares/validate.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { auditLog } from '../middlewares/auditLog.js';
import { createPrescriptionSchema } from '../validators/prescriptionValidators.js';

const router = Router();

router.use(requireAuth);

router.post('/', requireRole('doctor'), validate(createPrescriptionSchema), prescriptionController.createPrescription);
router.get(
  '/appointment/:appointmentId',
  auditLog('view_prescription', 'Prescription'),
  prescriptionController.getPrescriptionByAppointment
);

export default router;
