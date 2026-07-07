import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { trackEvents } from '../controllers/telemetry.controller';
import { verificarTokenOpcional } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validator.middleware';
import { trackEventsSchema } from '../schema/telemetry.schema';

const router = Router();

// Protegemos la ruta: Máximo 60 envíos de telemetría por minuto por IP
const telemetryLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 60, 
  message: { error: 'Demasiados eventos detectados. Bloqueo temporal por seguridad.' },
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/', telemetryLimiter, verificarTokenOpcional, validate(trackEventsSchema), trackEvents);

export default router;