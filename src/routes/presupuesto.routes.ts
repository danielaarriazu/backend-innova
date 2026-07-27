import { Router } from 'express';
import { cotizarPresupuesto } from '../controllers/presupuesto.controller';
import { authorize } from '../middlewares/authorize.middleware';
import { verificarToken } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validator.middleware'; // Asumiendo que tienes este middleware
import { cotizarPresupuestoSchema } from '../schema/presupuesto.schema';

const router = Router();

// Endpoint para que el emprendedor envíe la cotización
router.put('/:id/cotizar', verificarToken, authorize('EMPRENDEDOR'), validate(cotizarPresupuestoSchema), cotizarPresupuesto);

export default router;