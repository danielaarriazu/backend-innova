import express from 'express';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import { Request, Response } from 'express';
import faqCategoryRoutes from './routes/faq-category.routes';
import faqRoutes from './routes/faq.routes';

// Cargar variables de entorno del .env
dotenv.config();

const app = express();
app.set('trust proxy', true);
const PORT = process.env.PORT || 3000;

// Cargaramos el archivo de documentación
const swaggerDocument = YAML.load('./swagger.yaml');

// Middleware para entender JSON en el body de las peticiones
app.use(express.json());
// Documentación visual de Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Montamos las rutas de autenticación bajo el prefijo /api/auth
app.use('/api/auth', authRoutes);

// Montamos las rutas de usuario bajo el prefijo /api/user
app.use('/api/user', userRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Servidor de InnovaLab corriendo perfectamente' });
});

// Rutas para categorías de FAQ
app.use('/api/faq-categories', faqCategoryRoutes);
// Rutas para FAQs
app.use('/api/faqs', faqRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend escuchando en http://localhost:${PORT}`);
  console.log(`📄 Documentación oficial disponible en http://localhost:${PORT}/api-docs`);
});