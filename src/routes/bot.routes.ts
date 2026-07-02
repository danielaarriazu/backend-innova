import { Router } from 'express';
import { getBotConfig, updateBotConfig, actualizarConfig, obtenerRubros } from '../controllers/bot.controller';
import { verificarToken } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validator.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { uploadLogo } from '../middlewares/upload.middleware';
import { updateBotSchema } from '../schema/bot.schema';

const router = Router();

router.get('/', verificarToken, authorize('EMPRENDEDOR'), getBotConfig);

router.put('/', verificarToken, authorize('EMPRENDEDOR'), validate(updateBotSchema), updateBotConfig);

// "imagenLogo" es el nombre exacto del campo que el Frontend debe mandar
router.patch('/config', verificarToken, authorize('EMPRENDEDOR'), uploadLogo.single('imagenLogo'), actualizarConfig);

router.get('/rubros', obtenerRubros);

export default router;