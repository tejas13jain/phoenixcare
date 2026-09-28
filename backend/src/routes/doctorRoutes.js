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
router.get('/cities', doctorController.getDoctorCities);

router.get('/me/profile', requireAuth, requireRole('doctor'), doctorController.getMyDoctorProfile);
router.get('/me/patients', requireAuth, requireRole('doctor'), doctorController.getMyPatients);
router.patch(
  '/me/profile',
  requireAuth,
  requireRole('doctor'),
  validate(updateDoctorProfileSchema),
  doctorController.updateMyDoctorProfile
);

router.get('/me/analytics', requireAuth, requireRole('doctor'), doctorController.getMyAnalytics);
router.get('/me/reports/export', requireAuth, requireRole('doctor'), doctorController.exportMyReport);

router.get('/:id', validate(doctorIdSchema), doctorController.getDoctorById);

// /doctors/:doctorId/slots, etc.
router.use('/:doctorId/slots', slotRoutes);

export default router;
