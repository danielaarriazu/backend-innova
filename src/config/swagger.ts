import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Chatbot InnovaLab — API',
      version: '2.0.0',
      description: `API REST modular del chatbot comercial para emprendedores. Sprint 2 · Semana 3. Stack: Node.js + Express + TypeScript + PostgreSQL + Prisma.

---

**Endpoints principales por módulo**

- **Auth** → POST https://chatbot-innova-backend.onrender.com/api/auth/register · POST https://chatbot-innova-backend.onrender.com/api/auth/login
- **Chatbot** → POST https://chatbot-innova-backend.onrender.com/api/chatbot/chat
- **Catálogo** → GET https://chatbot-innova-backend.onrender.com/api/catalog/productos?usuarioId=1
- **Consultas** → POST https://chatbot-innova-backend.onrender.com/api/consultations?usuarioId=1
- **WhatsApp mock** → POST https://chatbot-innova-backend.onrender.com/api/whatsapp/session/init

---

**Probalo con estos negocios de ejemplo**

| usuarioId | Negocio | Sugerencias para escribir |
|-----------|---------|--------------------------|
| 1 | Panadería García | "hacen envíos?", "cómo pago", "quiero encargar una torta" |
| 2 | Ferretería López | "tienen garantía?", "hacen entregas?", "puedo devolver?" |
| 3 | Ropa & Accesorios Mía | "hola", "tienen talles?", "cuánto sale?" |

Usá el endpoint **/api/chatbot/chat** con el body \`{ "mensaje": "...", "sessionId": "cliente-1", "usuarioId": 1 }\` para ver el bot en acción.`,
    },
    servers: [
      {
        url: process.env.SERVER_URL || 'http://localhost:3000',
        description: process.env.SERVER_URL ? 'Render (producción)' : 'Local',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Registro e inicio de sesión de emprendedores' },
      { name: 'BotConfig', description: 'Configuración personalizada del chatbot por emprendedor' },
      { name: 'Chatbot', description: 'Motor conversacional por keywords + mock WhatsApp' },
      { name: 'Consultations', description: 'Consultas de clientes' },
      { name: 'Catalog', description: 'Catálogo de productos del emprendedor' },
      { name: 'FAQ', description: 'Preguntas frecuentes' },
      { name: 'Leads', description: 'Datos de contacto capturados en conversaciones' },
      { name: 'Clients', description: 'Mensajes dentro de cada consulta' },
    ],
  },
  apis: [
    process.env.NODE_ENV === 'production'
      ? './dist/modules/**/*.routes.js'
      : './src/modules/**/*.routes.ts',
  ],
};

export default swaggerJsdoc(options);
