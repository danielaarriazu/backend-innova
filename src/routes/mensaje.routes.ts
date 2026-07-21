import { Router } from 'express';
import { getHistorial } from '../controllers/mensaje.controller';
import { verificarToken } from '../middlewares/auth.middleware'; 

const router = Router();

// GET /api/mensajes/:botId/:sessionId
router.get('/:botId/:sessionId', verificarToken, getHistorial);

export default router;