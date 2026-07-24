import { Router } from 'express';
import { cotizarPresupuesto } from '../controllers/presupuesto.controller';
import { authorize } from '../middlewares/authorize.middleware';

const router = Router();

// Endpoint para que el emprendedor envíe la cotización
router.put('/:id/cotizar', cotizarPresupuesto, authorize('EMPRENDEDOR'));

export default router;