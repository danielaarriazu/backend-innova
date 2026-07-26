import { Router } from 'express';
import { getFAQsPublicas, getChatInit } from '../controllers/public.controller';
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
import { getBySlugSchema, initBotSchema } from '../schema/public.schema';

const router = Router();

// Endpoint público: para obtener FAQs públicas
router.get('/chatbot/:slug/faqs', validate(getBySlugSchema), getFAQsPublicas);

// Endpoint público: para inicializar el chat (saludo y botones)
router.get('/chatbot/:slug/init', validate(initBotSchema), getChatInit);

// Endpoints públicos: persistencia de la conversación del visitante.
router.post('/chatbot/:slug/consultations', validate(createConsultationSchema), createPublicConsultation);
router.post('/chatbot/:slug/consultations/:id/messages', validate(addConsultationMessageSchema), addPublicConsultationMessage);
router.patch('/chatbot/:slug/consultations/:id/contact', validate(updatePublicContactSchema), updatePublicConsultationContact);

export default router;
