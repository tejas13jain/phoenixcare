import { Router } from 'express';
import * as medicationController from '../controllers/medicationController.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth, requireRole('patient'));

router.get('/', medicationController.listMedications);
router.post('/', medicationController.createMedication);
router.delete('/:id', medicationController.deactivateMedication);

export default router;
