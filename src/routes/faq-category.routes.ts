import { Router } from 'express';
import { createCategory, getCategories, updateCategory, deleteCategory } from '../controllers/faq-category.controller';
import { verificarToken } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validator.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { createCategorySchema, updateCategorySchema, categoryParamsSchema } from '../schema/faq-category.schema';

const router = Router();

router.post('/', verificarToken, authorize('EMPRENDEDOR'), validate(createCategorySchema), createCategory);
router.get('/', verificarToken, authorize('EMPRENDEDOR'), getCategories);
router.put('/:id', verificarToken, authorize('EMPRENDEDOR'), validate(categoryParamsSchema, 'params'), validate(updateCategorySchema), updateCategory);
router.delete('/:id', verificarToken, authorize('EMPRENDEDOR'), validate(categoryParamsSchema, 'params'), deleteCategory);

export default router;