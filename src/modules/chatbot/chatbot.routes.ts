import { Router } from 'express';
import { chat, whatsappMock } from './chatbot.controller';

const router = Router();

/**
 * @swagger
 * /api/chatbot/chat:
 *   post:
 *     tags: [Chatbot]
 *     summary: Enviar un mensaje al bot
 *     description: |
 *       Envía un mensaje del cliente al bot del emprendedor. El bot responde según las FAQs y configuración del negocio.
 *
 *       Las consultas pueden llegar de dos formas:
 *
 *       **Por botón (UI):** el frontend manda el texto del botón como `mensaje`. Por ejemplo, cuando el cliente toca "Ver catálogo", el frontend envía `{ "mensaje": "ver catálogo", ... }`.
 *
 *       **Por palabra (texto libre):** el cliente escribe directamente en el chat. El bot detecta keywords en el texto y responde con la FAQ que más coincide. Si ninguna coincide, responde con un mensaje genérico del emprendedor.
 *
 *       **Ejemplos de prueba por emprendedor:**
 *
 *       Panadería García (usuarioId: 1) — probar con: "hacen envíos?", "cómo pago", "quiero encargar una torta"
 *       ```json
 *       { "mensaje": "hacen envíos?", "sessionId": "cliente-1", "usuarioId": 1 }
 *       ```
 *
 *       Ferretería López (usuarioId: 2) — probar con: "tienen garantía?", "hacen entregas?", "puedo devolver?"
 *       ```json
 *       { "mensaje": "tienen garantía?", "sessionId": "cliente-2", "usuarioId": 2 }
 *       ```
 *
 *       Ropa & Accesorios Mía (usuarioId: 3) — sin FAQs, siempre cae al fallback de keywords
 *       ```json
 *       { "mensaje": "hola", "sessionId": "cliente-3", "usuarioId": 3 }
 *       ```
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mensaje]
 *             properties:
 *               mensaje:
 *                 type: string
 *                 example: Hola, quiero ver los productos
 *               sessionId:
 *                 type: string
 *                 example: usuario-123
 *                 description: ID de sesión para mantener contexto conversacional (opcional)
 *               usuarioId:
 *                 type: integer
 *                 example: 1
 *                 description: ID del emprendedor — activa el modo DB con FAQs personalizadas (opcional)
 *     responses:
 *       200:
 *         description: Respuesta del bot
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 respuesta:
 *                   type: string
 *                 sessionId:
 *                   type: string
 *                 intencion:
 *                   type: string
 *                 fuente:
 *                   type: string
 *                   enum: [db, fallback]
 *                   description: '"db" si respondió con FAQs del emprendedor, "fallback" si usó keywords hardcodeadas'
 *       400:
 *         description: mensaje es requerido
 */
router.post('/chat', chat);

/**
 * @swagger
 * /api/chatbot/whatsapp-mock:
 *   post:
 *     tags: [Chatbot]
 *     summary: Simular mensaje entrante desde WhatsApp
 *     description: >
 *       Mock de integración con WhatsApp Web JS. Simula la llegada de un mensaje
 *       como si viniera de WhatsApp. La conexión real se implementa en sprints futuros.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [from, body]
 *             properties:
 *               from:
 *                 type: string
 *                 example: "5491112345678@c.us"
 *                 description: Número de WhatsApp del remitente (formato WhatsApp Web JS)
 *               body:
 *                 type: string
 *                 example: Hola, ¿cuánto cuesta el producto X?
 *               timestamp:
 *                 type: string
 *                 example: "2026-06-01T10:00:00Z"
 *               usuarioId:
 *                 type: integer
 *                 example: 1
 *                 description: ID del emprendedor para usar sus FAQs personalizadas (opcional)
 *     responses:
 *       200:
 *         description: Respuesta simulada del bot
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mock:
 *                   type: boolean
 *                 mensaje_entrante:
 *                   type: object
 *                 respuesta_bot:
 *                   type: string
 *                 intencion_detectada:
 *                   type: string
 *       400:
 *         description: from y body son requeridos
 */
router.post('/whatsapp-mock', whatsappMock);

export default router;
