import { Router } from 'express';
import { getHistorial } from '../controllers/mensaje.controller';
import { verificarTokenOpcional } from '../middlewares/auth.middleware'; 

const router = Router();

// GET /api/mensajes/:slug/:sessionId
router.get('/:slug/:sessionId', verificarTokenOpcional, getHistorial);

export default router;