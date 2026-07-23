import { Router } from 'express';
import {
  getConsultation,
  getConsultations,
  updateConsultationStatus,
  addEntrepreneurMessage
} from '../controllers/consultation.controller';
import { authorize } from '../middlewares/authorize.middleware';
import { verificarToken } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validator.middleware';
import { consultationParamsSchema, updateConsultationStatusSchema } from '../schema/consultation.schema';

const router = Router();

router.get('/', verificarToken, authorize('EMPRENDEDOR'), getConsultations);
router.get('/:id', verificarToken, authorize('EMPRENDEDOR'), validate(consultationParamsSchema, 'params'), getConsultation);
router.patch('/:id/estado', verificarToken, authorize('EMPRENDEDOR'), validate(consultationParamsSchema, 'params'), validate(updateConsultationStatusSchema), updateConsultationStatus);
router.post('/:id/mensajes', verificarToken, authorize('EMPRENDEDOR'), validate(consultationParamsSchema, 'params'), addEntrepreneurMessage);
export default router;