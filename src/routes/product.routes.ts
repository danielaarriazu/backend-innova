import { Router } from 'express';
import { createProduct, getProducts, updateProduct, deleteProduct } from '../controllers/product.controller';
import { verificarToken } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validator.middleware';
import { createProductSchema, updateProductSchema, getProductsSchema, deleteProductSchema} from '../schema/product.schema';

const router = Router();

router.post('/', verificarToken, validate(createProductSchema), createProduct);
router.get('/', verificarToken, validate(getProductsSchema), getProducts);
router.put('/:id', verificarToken, validate(updateProductSchema, 'params'),  validate(updateProductSchema), updateProduct);
router.delete('/:id', verificarToken, validate(deleteProductSchema, 'params'),  deleteProduct);

export default router;