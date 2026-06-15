import { Router } from 'express';
import { createFAQ, getFAQs, updateFAQ, deleteFAQ } from '../controllers/faq.controller';
import { verificarToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', verificarToken, createFAQ);
router.get('/', verificarToken, getFAQs);
router.put('/:id', verificarToken, updateFAQ);
router.delete('/:id', verificarToken, deleteFAQ);
export default router;