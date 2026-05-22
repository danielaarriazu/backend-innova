const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const app = express();

app.use(express.json());

// Documentación Swagger — disponible en /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas
const chatbotRoutes = require('./chatbot/chatbot.routes');
const emprendedorRoutes = require('./routes/emprendedor.routes');
const productoRoutes = require('./routes/producto.routes');
const faqRoutes = require('./routes/faq.routes');
const clienteRoutes = require('./routes/cliente.routes');
const consultaRoutes = require('./routes/consulta.routes');
const mensajeRoutes = require('./routes/mensaje.routes');

app.use('/api/chatbot', chatbotRoutes);
app.use('/api/emprendedores', emprendedorRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/consultas', consultaRoutes);
app.use('/api/mensajes', mensajeRoutes);

// Ruta de salud (health check)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = app;
