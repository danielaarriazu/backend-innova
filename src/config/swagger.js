const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Chatbot InnovaLab — API',
      version: '1.0.0',
      description:
        'API del chatbot comercial para emprendedores y pequeños negocios. ' +
        'Sprint 1 — Semana 1. Los endpoints marcados con 🚧 están planificados para sprints futuros.',
    },
    servers: [{ url: 'http://localhost:3000', description: 'Servidor local de desarrollo' }],
    tags: [
      { name: 'Chatbot', description: 'Motor conversacional del bot' },
      { name: 'Emprendedores', description: 'Registro y perfil de negocios' },
      { name: 'Productos', description: 'Catálogo de productos y servicios' },
    ],
  },
  // Solo lee los archivos donde hay comentarios @swagger
  apis: [
    './src/chatbot/chatbot.routes.js',
    './src/routes/emprendedor.routes.js',
    './src/routes/producto.routes.js',
  ],
};

module.exports = swaggerJsdoc(options);
