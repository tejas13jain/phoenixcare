import { Router } from 'express';
import * as appointmentController from '../controllers/appointmentController.js';
import { validate } from '../middlewares/validate.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import {
  createAppointmentSchema,
  listAppointmentsSchema,
  appointmentIdSchema,
  cancelAppointmentSchema,
} from '../validators/appointmentValidators.js';

const router = Router();

router.use(requireAuth);

/**
 * @openapi
 * /appointments:
 *   post:
 *     summary: Book an appointment slot (patient)
 *     tags: [Booking]
 *   get:
 *     summary: List the current user's appointments (patient or doctor)
 *     tags: [Booking]
 */
router.post('/', requireRole('patient'), validate(createAppointmentSchema), appointmentController.createAppointment);
router.get('/', validate(listAppointmentsSchema), appointmentController.listMyAppointments);

router.get('/:id', validate(appointmentIdSchema), appointmentController.getAppointmentById);
router.post('/:id/cancel', validate(cancelAppointmentSchema), appointmentController.cancelAppointment);
router.post('/:id/waiting-room', requireRole('patient'), validate(appointmentIdSchema), appointmentController.enterWaitingRoom);

export default router;
