import { Router } from 'express';
import {
  createFAQ,
  createFAQsFromSuggestions,
  deleteFAQ,
  getFAQs,
  getFAQSuggestions,
  updateFAQ,
} from '../controllers/faq.controller';
import { verificarToken } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validator.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import {
  createFaqSchema,
  createFaqsFromSuggestionsSchema,
  deleteFaqSchema,
  getFaqsSchema,
  updateFaqSchema,
} from '../schema/faq.schema';

const router = Router();

router.get('/suggestions', verificarToken, authorize('EMPRENDEDOR'), getFAQSuggestions);
router.post(
  '/from-suggestions',
  verificarToken,
  authorize('EMPRENDEDOR'),
  validate(createFaqsFromSuggestionsSchema),
  createFAQsFromSuggestions,
);
router.post('/', verificarToken, authorize('EMPRENDEDOR'), validate(createFaqSchema), createFAQ);
router.get('/', verificarToken, authorize('EMPRENDEDOR'), validate(getFaqsSchema, 'query'), getFAQs);
router.put('/:id', verificarToken, authorize('EMPRENDEDOR'), validate(deleteFaqSchema, 'params'), validate(updateFaqSchema), updateFAQ);
router.delete('/:id', verificarToken, authorize('EMPRENDEDOR'), validate(deleteFaqSchema, 'params'), deleteFAQ);
export default router;
