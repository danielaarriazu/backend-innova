import { Router } from 'express';
import { createFAQ, getFAQs, updateFAQ, deleteFAQ } from '../controllers/faq.controller';
import { verificarToken } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validator.middleware';
import { createFaqSchema, updateFaqSchema, getFaqsSchema, deleteFaqSchema } from '../schema/faq.schema';

const router = Router();

router.post('/', verificarToken, validate(createFaqSchema), createFAQ);
router.get('/', verificarToken, validate(getFaqsSchema), getFAQs);
router.put('/:id', verificarToken, validate(updateFaqSchema, 'params'), validate(updateFaqSchema), updateFAQ);
router.delete('/:id', verificarToken, validate(deleteFaqSchema, 'params'), deleteFAQ);
export default router;