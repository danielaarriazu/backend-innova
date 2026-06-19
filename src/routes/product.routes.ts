import { Router } from 'express';
import { createProduct, getProducts, updateProduct, deleteProduct } from '../controllers/product.controller';
import { verificarToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', verificarToken, createProduct);
router.get('/', verificarToken, getProducts);
router.put('/:id', verificarToken, updateProduct);
router.delete('/:id', verificarToken, deleteProduct);

export default router;