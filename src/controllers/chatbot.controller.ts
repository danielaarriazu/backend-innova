import { Request, Response } from 'express';
import { procesarAccionBot } from '../services/chatbot.service';
 
export const chat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { accion, sessionId, botId, datosCliente, contextoActual } = req.body;
 
    if (!accion || !sessionId || !botId) {
      res.status(400).json({ error: 'Faltan parámetros: accion, sessionId, botId' });
      return;
    }
 
    const resultado = await procesarAccionBot(accion, sessionId, botId, datosCliente, contextoActual);
    res.status(200).json(resultado);
 
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Error interno' });
  }
};
