import { Router } from 'express';
import { createCategory, getCategories, updateCategory, deleteCategory } from '../controllers/faq-category.controller';
import { verificarToken } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validator.middleware';
import { createCategorySchema, updateCategorySchema, categoryParamsSchema } from '../schema/faq-category.schema';

const router = Router();

router.post('/', verificarToken, validate(createCategorySchema), createCategory);
router.get('/', verificarToken, getCategories);
router.put('/:id', verificarToken, validate(categoryParamsSchema, 'params'), validate(updateCategorySchema), updateCategory);
router.delete('/:id', verificarToken, validate(categoryParamsSchema, 'params'), deleteCategory);

export default router;