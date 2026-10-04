import { Router } from 'express';
import * as surgeryEnquiryController from '../controllers/surgeryEnquiryController.js';
import { attachUserIfPresent, requireAuth, requireRole } from '../middlewares/auth.js';
import { enquiryLimiter } from '../middlewares/rateLimiters.js';
import { validate } from '../middlewares/validate.js';
import {
  createSurgeryEnquirySchema,
  listSurgeryEnquiriesSchema,
  updateSurgeryEnquiryStatusSchema,
} from '../validators/surgeryEnquiryValidators.js';

const router = Router();

router.post(
  '/enquiries',
  enquiryLimiter,
  attachUserIfPresent,
  validate(createSurgeryEnquirySchema),
  surgeryEnquiryController.createEnquiry
);
router.get(
  '/enquiries',
  requireAuth,
  requireRole('admin'),
  validate(listSurgeryEnquiriesSchema),
  surgeryEnquiryController.listEnquiries
);
router.patch(
  '/enquiries/:id/status',
  requireAuth,
  requireRole('admin'),
  validate(updateSurgeryEnquiryStatusSchema),
  surgeryEnquiryController.updateEnquiryStatus
);

export default router;
