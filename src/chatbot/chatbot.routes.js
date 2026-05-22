const express = require('express');
const router = express.Router();
const ctrl = require('./chatbot.controller');

/**
 * @swagger
 * /api/chatbot/chat:
 *   post:
 *     tags: [Chatbot]
 *     summary: Enviá un mensaje y el bot responde
 *     description: >
 *       Motor conversacional por palabras clave. No requiere base de datos.
 *       El bot entiende texto libre en español (precios, catálogo, presupuesto, contacto, etc.)
 *       y mantiene contexto dentro de la misma sesión (recuerda el nombre del usuario, el tema anterior,
 *       y detecta si el usuario está confundido para ofrecer derivación humana).
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
 *                 description: Texto libre del usuario
 *                 example: "quiero ver los precios"
 *               sessionId:
 *                 type: string
 *                 description: ID de sesión para mantener contexto. Si no se envía, se crea uno nuevo.
 *                 example: "usuario-123"
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
 *                   example: "Buena pregunta 💰 Los precios dependen del producto..."
 *                 sessionId:
 *                   type: string
 *                   example: "usuario-123"
 *                 intencion:
 *                   type: string
 *                   description: Intención detectada por el motor
 *                   example: "precio"
 *       400:
 *         description: Falta el campo "mensaje"
 */
router.post('/chat', ctrl.chat);

/**
 * @swagger
 * /api/chatbot/iniciar:
 *   post:
 *     tags: [Chatbot]
 *     summary: Inicia una conversación nueva (requiere DB)
 *     description: >
 *       Crea una sesión de conversación en la base de datos y devuelve
 *       el mensaje de bienvenida personalizado con el nombre del negocio.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_emprendedor]
 *             properties:
 *               id_emprendedor:
 *                 type: integer
 *                 example: 1
 *               canal:
 *                 type: string
 *                 enum: [web, whatsapp]
 *                 default: web
 *     responses:
 *       201:
 *         description: Conversación iniciada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_consulta:
 *                   type: integer
 *                   example: 7
 *                 respuesta:
 *                   type: string
 *                   example: "¡Hola! Bienvenido/a a Panadería La Estrella 👋..."
 *                 paso:
 *                   type: string
 *                   example: "MENU"
 *       400:
 *         description: Falta id_emprendedor
 */
router.post('/iniciar', ctrl.iniciarConversacion);

/**
 * @swagger
 * /api/chatbot/historial/{id_consulta}:
 *   get:
 *     tags: [Chatbot]
 *     summary: Historial de mensajes de una conversación (requiere DB)
 *     description: Devuelve todos los mensajes de una conversación en orden cronológico, indicando si cada uno fue enviado por el cliente, el bot, o un humano.
 *     parameters:
 *       - in: path
 *         name: id_consulta
 *         required: true
 *         schema:
 *           type: integer
 *         example: 7
 *     responses:
 *       200:
 *         description: Lista de mensajes
 *         content:
 *           application/json:
 *             example:
 *               - origen: "bot"
 *                 contenido: "¡Hola! Bienvenido/a..."
 *                 created_at: "2025-05-22T14:30:00Z"
 *               - origen: "cliente"
 *                 contenido: "1"
 *                 created_at: "2025-05-22T14:30:05Z"
 */
router.get('/historial/:id_consulta', ctrl.obtenerHistorial);

router.post('/mensaje', ctrl.enviarMensaje);

module.exports = router;
