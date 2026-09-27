import { Router } from 'express';
import authRoutes from './authRoutes.js';
import doctorRoutes from './doctorRoutes.js';
import appointmentRoutes from './appointmentRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import prescriptionRoutes from './prescriptionRoutes.js';
import healthRecordRoutes from './healthRecordRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import consultationRoutes from './consultationRoutes.js';
import adminRoutes from './adminRoutes.js';
import pushRoutes from './pushRoutes.js';
import wellnessRoutes from './wellnessRoutes.js';
import patientRoutes from './patientRoutes.js';

const router = Router();

router.get('/health', (req, res) => res.json({ success: true, message: 'PhoenixCare API is healthy' }));

router.use('/auth', authRoutes);
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/payments', paymentRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/health-records', healthRecordRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/consultations', consultationRoutes);
router.use('/admin', adminRoutes);
router.use('/push', pushRoutes);
router.use('/wellness', wellnessRoutes);
router.use('/patients', patientRoutes);

export default router;
