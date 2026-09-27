import { Router } from 'express';
import * as healthRecordController from '../controllers/healthRecordController.js';
import { validate } from '../middlewares/validate.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { auditLog } from '../middlewares/auditLog.js';
import { upload } from '../config/cloudinary.js';
import { createHealthRecordSchema } from '../validators/healthRecordValidators.js';

const router = Router();

router.use(requireAuth, requireRole('patient'));

router.post('/', upload.single('file'), validate(createHealthRecordSchema), healthRecordController.uploadHealthRecord);
router.get('/', auditLog('view_health_records', 'HealthRecord'), healthRecordController.listMyHealthRecords);
router.delete('/:id', healthRecordController.deleteHealthRecord);

export default router;
