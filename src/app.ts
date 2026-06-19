import express, { Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import faqCategoryRoutes from './routes/faq-category.routes';
import faqRoutes from './routes/faq.routes';
import botRoutes from './routes/bot.routes';
import productRoutes from './routes/product.routes';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

app.set('trust proxy', true);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// 10 intentos cada 15 minutos por IP, solo en los endpoints de auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos. Esperá 15 minutos antes de volver a intentar.' },
  standardHeaders: true, 
  legacyHeaders: false   
});

const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Servidor de InnovaLab corriendo perfectamente' });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/faq-categories', faqCategoryRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/bot', botRoutes);
app.use('/api/products', productRoutes);

app.use(errorHandler);

export default app;