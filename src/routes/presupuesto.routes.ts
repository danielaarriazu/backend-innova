import { Router } from 'express';
import {
  cotizarPresupuesto,
  createBudget,
  getBudget,
  getBudgets,
  updateBudgetStatus,
} from '../controllers/presupuesto.controller';
import { authorize } from '../middlewares/authorize.middleware';
import { verificarToken } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validator.middleware';
import {
  cambiarEstadoSchema,
  cotizarPresupuestoSchema,
  crearPresupuestoSchema,
  listarPresupuestosSchema,
  presupuestoIdParamsSchema,
} from '../schema/presupuesto.schema';

const router = Router();

router.use(verificarToken, authorize('EMPRENDEDOR'));

router.post('/', validate(crearPresupuestoSchema), createBudget);
router.get('/', validate(listarPresupuestosSchema, 'query'), getBudgets);
router.get('/:id', validate(presupuestoIdParamsSchema, 'params'), getBudget);
router.patch(
  '/:id/estado',
  validate(presupuestoIdParamsSchema, 'params'),
  validate(cambiarEstadoSchema),
  updateBudgetStatus,
);
router.put(
  '/:id/cotizar',
  validate(presupuestoIdParamsSchema, 'params'),
  validate(cotizarPresupuestoSchema),
  cotizarPresupuesto,
);

export default router;
