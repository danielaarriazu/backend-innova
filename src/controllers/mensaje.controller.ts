import { Request, Response } from 'express';
import * as mensajeService from '../services/mensaje.service';

export const getHistorial = async (req: Request, res: Response) => {
  try {
    const { slug, sessionId } = req.params;

    if (!slug || !sessionId) {
      return res.status(400).json({ error: 'Faltan parámetros slug o sessionId' });
    }

    const historial = await mensajeService.obtenerHistorialPorSesion(slug, sessionId);
    
    return res.status(200).json(historial);
  } catch (error) {
    console.error('Error al obtener el historial:', error);
    return res.status(500).json({ error: 'Error interno al obtener los mensajes' });
  }
};
