import { Request, Response } from 'express';
import * as mensajeService from '../services/mensaje.service';

export const getHistorial = async (req: Request, res: Response) => {
  try {
    const { botId, sessionId } = req.params;

    if (!botId || !sessionId) {
      return res.status(400).json({ error: 'Faltan parámetros botId o sessionId' });
    }

    const historial = await mensajeService.obtenerHistorialPorSesion(botId, sessionId);
    
    return res.status(200).json(historial);
  } catch (error) {
    console.error('Error al obtener el historial:', error);
    return res.status(500).json({ error: 'Error interno al obtener los mensajes' });
  }
};
