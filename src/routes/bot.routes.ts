import { Router } from 'express';
import { getBotConfig, updateBotConfig } from '../controllers/bot.controller';
import { verificarToken } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validator.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { updateBotSchema } from '../schema/bot.schema';

const router = Router();

router.get('/', verificarToken, authorize('EMPRENDEDOR'), getBotConfig);

router.put('/', verificarToken, authorize('EMPRENDEDOR'), validate(updateBotSchema), updateBotConfig);

export default router;