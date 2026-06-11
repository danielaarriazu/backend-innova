/** src/modules/whatsapp/whatsapp.controller.ts */
import { Request, Response } from 'express';
import { initWhatsAppSession, sendMessage, getSessionStatus, simulateIncoming } from './whatsapp.mock';

/**
 * @swagger
 * tags:
 *   name: WhatsApp
 *   description: Integración simulada con WhatsApp Web JS
 */

/**
 * @swagger
 * /api/whatsapp/session/init:
 *   post:
 *     summary: Inicializar sesión de WhatsApp (mock)
 *     tags: [WhatsApp]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId]
 *             properties:
 *               sessionId:
 *                 type: string
 *                 example: emprendedor_1
 *     responses:
 *       200:
 *         description: Sesión inicializada
 *       400:
 *         description: sessionId requerido
 */
export const initSession = async (req: Request, res: Response): Promise<void> => {
  const { sessionId } = req.body;
  if (!sessionId) {
    res.status(400).json({ error: 'sessionId requerido' });
    return;
  }
  await initWhatsAppSession(sessionId);
  res.json({ message: `Sesión ${sessionId} inicializada`, status: 'connected' });
};

/**
 * @swagger
 * /api/whatsapp/session/{sessionId}/status:
 *   get:
 *     summary: Estado de la sesión de WhatsApp
 *     tags: [WhatsApp]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estado de la sesión
 */
export const sessionStatus = (req: Request, res: Response): void => {
  const { sessionId } = req.params;
  const status = getSessionStatus(sessionId);
  res.json({ sessionId, status });
};

/**
 * @swagger
 * /api/whatsapp/send:
 *   post:
 *     summary: Enviar mensaje simulado por WhatsApp
 *     tags: [WhatsApp]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [to, body, sessionId]
 *             properties:
 *               to:
 *                 type: string
 *                 example: "5491112345678"
 *               body:
 *                 type: string
 *                 example: "Hola, ¿cómo puedo ayudarte?"
 *               sessionId:
 *                 type: string
 *                 example: emprendedor_1
 *     responses:
 *       200:
 *         description: Mensaje enviado
 *       400:
 *         description: Parámetros faltantes o sesión no inicializada
 */
export const sendMsg = async (req: Request, res: Response): Promise<void> => {
  const { to, body, sessionId } = req.body;
  if (!to || !body || !sessionId) {
    res.status(400).json({ error: 'to, body y sessionId son requeridos' });
    return;
  }
  try {
    const result = await sendMessage(to, body, sessionId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * @swagger
 * /api/whatsapp/receive:
 *   post:
 *     summary: Simular recepción de mensaje entrante de WhatsApp
 *     tags: [WhatsApp]
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
 *                 example: "5491198765432"
 *               body:
 *                 type: string
 *                 example: "¿Cuáles son sus precios?"
 *     responses:
 *       200:
 *         description: Mensaje simulado recibido
 */
export const receiveMsg = (req: Request, res: Response): void => {
  const { from, body } = req.body;
  if (!from || !body) {
    res.status(400).json({ error: 'from y body son requeridos' });
    return;
  }
  const msg = simulateIncoming({ from, body, timestamp: new Date() });
  res.json({ received: true, message: msg });
};
