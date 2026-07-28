import { Router } from 'express';
import { cotizarPresupuesto, 
         listarPresupuestos, 
         cambiarEstadoPresupuesto, 
         obtenerPresupuestoDetalle } from '../controllers/presupuesto.controller';
import { authorize } from '../middlewares/authorize.middleware';
import { verificarToken } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validator.middleware'; 
import { cotizarPresupuestoSchema, 
         getPresupuestosSchema, 
         actualizarEstadoPresupuestoSchema } from '../schema/presupuesto.schema';

const router = Router();

// Endpoint para que el emprendedor envíe la cotización
router.put('/:id/cotizar', verificarToken, authorize('EMPRENDEDOR'), validate(cotizarPresupuestoSchema, 'all'), cotizarPresupuesto);

// Endpoint para listar y filtrar presupuestos
router.get('/', verificarToken, authorize('EMPRENDEDOR'), validate(getPresupuestosSchema, 'query'), listarPresupuestos);

// Cambiar el estado de un presupuesto de forma manual
router.patch('/:id/estado', verificarToken, authorize('EMPRENDEDOR'), validate(actualizarEstadoPresupuestoSchema, 'all'), cambiarEstadoPresupuesto);

// Obtener un presupuesto por ID
router.get('/:id', verificarToken, authorize('EMPRENDEDOR'), obtenerPresupuestoDetalle);

export default router;
