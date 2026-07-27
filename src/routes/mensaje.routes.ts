import { Router } from 'express';
import { getHistorial } from '../controllers/mensaje.controller';
import { verificarTokenOpcional } from '../middlewares/auth.middleware'; 
import { validate } from '../middlewares/validator.middleware'; 
import { getHistorialSchema } from '../schema/mensaje.schema';

const router = Router();

// GET /api/mensajes/:slug/:sessionId
router.get('/:slug/:sessionId', verificarTokenOpcional, validate(getHistorialSchema, 'all'), getHistorial);

export default router;