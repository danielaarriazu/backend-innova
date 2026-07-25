import { Router } from 'express';
import { getFAQsPublicas, getChatInit, getProductosPublicos } from '../controllers/public.controller';
import { validate } from '../middlewares/validator.middleware';

const router = Router();

// Endpoint público: para obtener FAQs públicas
router.get('/chatbot/:slug/faqs', getFAQsPublicas);

// Endpoint público: para obtener productos activos del catálogo
router.get('/chatbot/:slug/products', getProductosPublicos);

// Endpoint público: para inicializar el chat (saludo y botones)
router.get('/chatbot/:slug/init', getChatInit);

export default router;