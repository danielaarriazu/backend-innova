import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';

const router = Router();

// Endpoint para crear la cuenta
router.post('/register', register);

// Endpoint para iniciar sesión
router.post('/login', login);

export default router;