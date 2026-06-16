import express, { Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import faqCategoryRoutes from './routes/faq-category.routes';
import faqRoutes from './routes/faq.routes';
import botRoutes from './routes/bot.routes';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

app.set('trust proxy', true);

app.use(express.json());

const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Servidor de InnovaLab corriendo perfectamente' });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/faq-categories', faqCategoryRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/bot', botRoutes);

app.use(errorHandler);

export default app;