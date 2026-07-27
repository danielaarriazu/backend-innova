import { Router } from 'express';
import { cotizarPresupuesto, listarPresupuestos } from '../controllers/presupuesto.controller';
import { authorize } from '../middlewares/authorize.middleware';
import { verificarToken } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validator.middleware'; 
import { cotizarPresupuestoSchema, getPresupuestosSchema } from '../schema/presupuesto.schema';

const router = Router();

// Endpoint para que el emprendedor envíe la cotización
router.put('/:id/cotizar', verificarToken, authorize('EMPRENDEDOR'), validate(cotizarPresupuestoSchema), cotizarPresupuesto);

// Endpoint para listar y filtrar presupuestos (Propios/Chatbot, Estados)
router.get('/', verificarToken, authorize('EMPRENDEDOR'), validate(getPresupuestosSchema, 'query'), listarPresupuestos);
export default router;