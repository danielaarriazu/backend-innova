import { Router } from 'express';
import { createCategory, getCategories, updateCategory, deleteCategory } from '../controllers/faq-category.controller';
import { verificarToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', verificarToken, createCategory);
router.get('/', verificarToken, getCategories);
router.put('/:id', verificarToken, updateCategory);
router.delete('/:id', verificarToken, deleteCategory);

export default router;