import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/doctors/pending', adminController.listPendingDoctors);
router.patch('/doctors/:id/kyc', adminController.reviewDoctorKyc);

router.get('/users', adminController.listUsers);
router.patch('/users/:id/status', adminController.setUserActiveStatus);

router.get('/analytics/overview', adminController.getAnalyticsOverview);

router.get('/payments', adminController.listPayments);
router.patch('/payments/:id/payout', adminController.updatePayoutStatus);

router.get('/appointments', adminController.listAllAppointments);
router.get('/reports/appointments/export', adminController.exportAppointmentsReport);
router.get('/reports/payments/export', adminController.exportPaymentsReport);

router.get('/reviews/flagged', adminController.listFlaggedReviews);
router.patch('/reviews/:id/moderate', adminController.moderateReview);

router.post('/campaigns', adminController.sendCampaign);

export default router;
