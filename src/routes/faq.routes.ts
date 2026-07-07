import { Router } from 'express';
import { createFAQ, getFAQs, updateFAQ, deleteFAQ } from '../controllers/faq.controller';
import { verificarToken } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validator.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { createFaqSchema, updateFaqSchema, getFaqsSchema, deleteFaqSchema } from '../schema/faq.schema';

const router = Router();

router.post('/', verificarToken, authorize('EMPRENDEDOR'), validate(createFaqSchema), createFAQ);
router.get('/', verificarToken, authorize('EMPRENDEDOR'), validate(getFaqsSchema, 'query'), getFAQs);
router.put('/:id', verificarToken, authorize('EMPRENDEDOR'), validate(deleteFaqSchema, 'params'), validate(updateFaqSchema), updateFAQ);
router.delete('/:id', verificarToken, authorize('EMPRENDEDOR'), validate(deleteFaqSchema, 'params'), deleteFAQ);
export default router;