import { Router } from 'express';
import {
  getFAQsPublicas,
  getChatInit,
  getProductosPublicos,
} from '../controllers/public.controller';
import {
  addPublicConsultationMessage,
  createPublicConsultation,
  updatePublicConsultationContact,
} from '../controllers/consultation.controller';
import { validate } from '../middlewares/validator.middleware';
import {
  addConsultationMessageSchema,
  createConsultationSchema,
  updatePublicContactSchema,
} from '../schema/consultation.schema';

const router = Router();

// Endpoint público: para obtener FAQs públicas
router.get('/chatbot/:slug/faqs', getFAQsPublicas);

// Endpoint público: para obtener productos activos del catálogo
router.get('/chatbot/:slug/products', getProductosPublicos);

// Endpoint público: para inicializar el chat (saludo y botones)
router.get('/chatbot/:slug/init', getChatInit);

// Endpoints públicos: persistencia de la conversación del visitante.
router.post(
  '/chatbot/:slug/consultations',
  validate(createConsultationSchema),
  createPublicConsultation,
);
router.post(
  '/chatbot/:slug/consultations/:id/messages',
  validate(addConsultationMessageSchema),
  addPublicConsultationMessage,
);
router.patch(
  '/chatbot/:slug/consultations/:id/contact',
  validate(updatePublicContactSchema),
  updatePublicConsultationContact,
);

export default router;
