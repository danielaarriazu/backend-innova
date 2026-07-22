import { Router } from 'express';
import { register, login, googleLogin } from '../controllers/auth.controller';
import { validate } from '../middlewares/validator.middleware';
import { registerSchema, loginSchema, googleLoginSchema } from '../schema/auth.schema';

const router = Router();

// Endpoint para crear la cuenta
router.post('/register', validate(registerSchema), register);

// Endpoint para iniciar sesión
router.post('/login', validate(loginSchema), login);

router.post('/google', validate(googleLoginSchema), googleLogin);

export default router;
