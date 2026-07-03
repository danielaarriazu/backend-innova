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
import telemetryRoutes from './routes/telemetry.routes';
import { errorHandler } from './middlewares/error.middleware';
import prisma from './lib/prisma';
import { corsOptions } from './lib/cors.config';

const app = express();

app.set('trust proxy', 1);

app.use(cors(corsOptions));

app.use(express.json());

// Se aplica a todas las rutas. Bloquea cualquier script que bombardee el servidor de forma indiscriminada.
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 500,
  message: { error: 'Demasiadas solicitudes. Intente nuevamente en un momento.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health', 
});

// Limiter de API — protege las rutas de negocio autenticadas.
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  message: { error: 'Demasiadas solicitudes a la API. Intente nuevamente en un momento.' },
  standardHeaders: true,
  legacyHeaders: false,
});

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

app.get('/health', async (req: Request, res: Response) => {
  try{
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'OK', db: 'connected', timestamp: new Date().toISOString() });
  }
  catch{
    res.status(503).json({ status: 'ERROR', db: 'disconnected', timestamp: new Date().toISOString() });
  }
 
});

app.use(globalLimiter);
app.use('/api', apiLimiter);

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/faq-categories', faqCategoryRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/bot', botRoutes);
app.use('/api/products', productRoutes);
app.use('/api/telemetry', telemetryRoutes);

app.use(errorHandler);

export default app;