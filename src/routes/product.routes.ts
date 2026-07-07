import { Router } from 'express';
import { createProduct, getProducts, updateProduct, deleteProduct } from '../controllers/product.controller';
import { verificarToken } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validator.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { uploadProducto } from '../middlewares/upload.middleware';
import { createProductSchema, updateProductSchema, getProductsSchema, deleteProductSchema} from '../schema/product.schema';

const router = Router();

router.post('/', verificarToken, authorize('EMPRENDEDOR'), uploadProducto.single('imagen'), validate(createProductSchema), createProduct);
router.get('/', verificarToken, authorize('EMPRENDEDOR'), validate(getProductsSchema,'query'), getProducts);
router.put('/:id', verificarToken, authorize('EMPRENDEDOR'), uploadProducto.single('imagen'), validate(deleteProductSchema, 'params'),  validate(updateProductSchema), updateProduct);
router.delete('/:id', verificarToken, authorize('EMPRENDEDOR'), validate(deleteProductSchema, 'params'),  deleteProduct);

export default router;