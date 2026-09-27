import { Router } from 'express';
import * as doctorController from '../controllers/doctorController.js';
import { validate } from '../middlewares/validate.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { listDoctorsSchema, doctorIdSchema, updateDoctorProfileSchema } from '../validators/doctorValidators.js';
import slotRoutes from './slotRoutes.js';

const router = Router();

/**
 * @openapi
 * /doctors:
 *   get:
 *     summary: Search & filter verified doctors
 *     tags: [Doctors]
 */
router.get('/', validate(listDoctorsSchema), doctorController.listDoctors);
router.get('/featured', doctorController.getFeaturedDoctors);
router.get('/specialties', doctorController.getDoctorSpecialties);

router.get('/me/profile', requireAuth, requireRole('doctor'), doctorController.getMyDoctorProfile);
router.patch(
  '/me/profile',
  requireAuth,
  requireRole('doctor'),
  validate(updateDoctorProfileSchema),
  doctorController.updateMyDoctorProfile
);

router.get('/:id', validate(doctorIdSchema), doctorController.getDoctorById);

// /doctors/:doctorId/slots, etc.
router.use('/:doctorId/slots', slotRoutes);

export default router;
