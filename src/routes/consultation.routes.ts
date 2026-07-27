import { Router } from 'express';
import {
  getConsultation,
  getConsultations,
  updateConsultationStatus,
  addEntrepreneurMessage,
  updateChatControl,
  getConsultasEmprendedor
} from '../controllers/consultation.controller';
import { authorize } from '../middlewares/authorize.middleware';
import { verificarToken } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validator.middleware';
import { consultationParamsSchema, updateConsultationStatusSchema, slugParamsSchema } from '../schema/consultation.schema';

const router = Router();

router.get('/', verificarToken, authorize('EMPRENDEDOR'), getConsultations);
router.get('/:id', verificarToken, authorize('EMPRENDEDOR'), validate(consultationParamsSchema, 'params'), getConsultation);
router.patch('/:id/estado', verificarToken, authorize('EMPRENDEDOR'), validate(consultationParamsSchema, 'params'), validate(updateConsultationStatusSchema), updateConsultationStatus);
router.post('/:id/mensajes', verificarToken, authorize('EMPRENDEDOR'), validate(consultationParamsSchema, 'params'), addEntrepreneurMessage);
router.patch('/:id/control-chat', verificarToken, authorize('EMPRENDEDOR'), validate(consultationParamsSchema, 'params'), updateChatControl);
router.get('/:slug/derivadas',verificarToken, authorize('EMPRENDEDOR'), validate(slugParamsSchema, 'params'), getConsultasEmprendedor);
export default router;