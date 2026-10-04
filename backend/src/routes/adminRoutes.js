import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import * as adminDoctorController from '../controllers/adminDoctorController.js';
import * as labController from '../controllers/labController.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createDoctorSchema, doctorIdParamSchema, searchDoctorsSchema, updateDoctorByAdminSchema } from '../validators/adminDoctorValidators.js';
import { adminListLabsSchema, createLabSchema, labIdSchema, updateLabSchema } from '../validators/labValidators.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/doctors/pending', adminController.listPendingDoctors);
router.patch('/doctors/:id/kyc', adminController.reviewDoctorKyc);
router.get('/doctors', validate(searchDoctorsSchema), adminDoctorController.searchDoctors);
router.post('/doctors', validate(createDoctorSchema), adminDoctorController.createDoctor);
router.patch('/doctors/:id', validate(updateDoctorByAdminSchema), adminDoctorController.updateDoctorByAdmin);
router.post('/doctors/:id/standards-email', validate(doctorIdParamSchema), adminDoctorController.resendStandardsEmail);

router.get('/labs', validate(adminListLabsSchema), labController.adminListLabs);
router.post('/labs', validate(createLabSchema), labController.adminCreateLab);
router.get('/labs/:id', validate(labIdSchema), labController.adminGetLab);
router.patch('/labs/:id', validate(updateLabSchema), labController.adminUpdateLab);

router.get('/users', adminController.listUsers);
router.patch('/users/:id/status', adminController.setUserActiveStatus);

router.get('/analytics/overview', adminController.getAnalyticsOverview);

router.get('/payments', adminController.listPayments);
router.patch('/payments/:id/payout', adminController.updatePayoutStatus);

router.get('/appointments', adminController.listAllAppointments);
router.get('/reports/appointments/export', adminController.exportAppointmentsReport);
router.get('/reports/payments/export', adminController.exportPaymentsReport);
router.get('/reports/doctors/export', adminController.exportDoctorsReport);

router.get('/reviews/flagged', adminController.listFlaggedReviews);
router.patch('/reviews/:id/moderate', adminController.moderateReview);

router.post('/campaigns', adminController.sendCampaign);

export default router;
