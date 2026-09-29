import { Router } from 'express';
import * as footerSettingsController from '../controllers/footerSettingsController.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { updateFooterSettingsSchema } from '../validators/footerSettingsValidators.js';

const router = Router();

router.get('/footer', footerSettingsController.getFooterSettings);
router.put(
  '/footer',
  requireAuth,
  requireRole('admin'),
  validate(updateFooterSettingsSchema),
  footerSettingsController.updateFooterSettings
);

export default router;
