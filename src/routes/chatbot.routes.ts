import { Router } from 'express';
import { chat } from '../controllers/chatbot.controller';
import { validate } from '../middlewares/validator.middleware';
import { chatSchema } from '../schema/chatbot.schema';

const router = Router();

router.post('/chat', validate(chatSchema), chat);

export default router;