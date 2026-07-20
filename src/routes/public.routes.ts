import { Router } from 'express';
import { getFAQsPublicas, getChatInit } from '../controllers/public.controller';
import { validate } from '../middlewares/validator.middleware';

const router = Router();

// Endpoint público: para obtener FAQs públicas
router.get('/chatbot/:slug/faqs', getFAQsPublicas);

// Endpoint público: para inicializar el chat (saludo y botones)
router.get('/chatbot/:slug/init', getChatInit);

export default router;