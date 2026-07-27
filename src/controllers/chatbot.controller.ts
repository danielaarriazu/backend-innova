import { Request, Response } from 'express';
import { gestionarInteraccion } from '../services/chatbot.service';
export const chat = async (req: Request, res: Response): Promise<void> => {
  try {
    const resultado = await gestionarInteraccion(req.body);
    
    res.status(200).json(resultado);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Error interno' });
  }
};