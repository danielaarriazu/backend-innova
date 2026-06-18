import { Router } from 'express';
import { changePassword, DeleteUser } from '../controllers/user.controller';
import { verificarToken } from '../middlewares/auth.middleware';

const router = Router();

// Endpoint para cambiar la contraseña (POST /api/user/change-password)
router.post('/change-password', verificarToken, changePassword);

// Endpoint para el falso eliminar (DELETE /api/user/delete-account)
router.delete('/delete-account', verificarToken, DeleteUser);

export default router;