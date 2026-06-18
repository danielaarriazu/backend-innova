import { Router } from 'express';
import { getBotConfig, updateBotConfig } from '../controllers/bot.controller';
import { verificarToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', verificarToken, getBotConfig);

router.put('/', verificarToken, updateBotConfig);

export default router;