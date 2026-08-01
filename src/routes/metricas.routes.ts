import { Router } from 'express';
import { getDashboardData, getMetricasData } from '../controllers/metricas.controller';
import { verificarToken } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';

const router = Router();

// Endpoint para la pantalla principal (Dashboard)
router.get('/dashboard', verificarToken, authorize('EMPRENDEDOR'), getDashboardData);

// Endpoint para la pantalla de Métricas 
router.get('/reportes', verificarToken, authorize('EMPRENDEDOR'), getMetricasData);

export default router;