import { Router } from 'express';
import * as reviewController from '../controllers/reviewController.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

router.post('/', requireAuth, requireRole('patient'), reviewController.createReview);
router.get('/doctor/:doctorId', reviewController.listDoctorReviews);

export default router;
