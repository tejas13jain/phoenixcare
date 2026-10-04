import { Router } from 'express';
import * as labController from '../controllers/labController.js';
import { validate } from '../middlewares/validate.js';
import { labIdSchema, listLabsSchema } from '../validators/labValidators.js';

const router = Router();

router.get('/', validate(listLabsSchema), labController.listLabs);
router.get('/cities', labController.getLabCities);
router.get('/:id', validate(labIdSchema), labController.getLab);

export default router;
