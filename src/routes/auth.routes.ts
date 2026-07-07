import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';
import { validate } from '../middlewares/validator.middleware';
import { registerSchema, loginSchema } from '../schema/auth.schema';

const router = Router();

// Endpoint para crear la cuenta
router.post('/register', validate(registerSchema), register);

// Endpoint para iniciar sesión
router.post('/login', validate(loginSchema), login);

export default router;