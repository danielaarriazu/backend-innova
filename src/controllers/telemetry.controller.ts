import { Request, Response } from 'express';
import * as telemetryService from '../services/telemetry.service';

export const trackEvents = async (req: Request, res: Response): Promise<void> => {
  const { sessionId, eventos } = req.body;

  if (!sessionId || !Array.isArray(eventos) || eventos.length === 0) {
    res.status(400).json({ error: 'Datos de telemetría inválidos' });
    return;
  }

  const usuarioId = req.usuario?.email; // para identificar al usuario si está logueado, despues podemos usar el id.
  const ip = req.ip || req.socket.remoteAddress;
  const dispositivo = req.headers['user-agent'];

  // Enviamos a Redis de forma asíncrona sin bloquear la respuesta al front
  telemetryService.enviarEventosQueue({ sessionId, usuarioId, ip, dispositivo, eventos });

  // Respondemos inmediatamente al frontend
  res.status(200).json({ success: true, message: 'Eventos registrados' });
};