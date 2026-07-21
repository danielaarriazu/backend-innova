import { Request, Response } from 'express';
import * as telemetryService from '../services/telemetry.service';

export const trackEvents = async (req: Request, res: Response): Promise<void> => {
  const { sessionId, eventos, botId, tipoUsuario } = req.body;
  const usuarioId = req.usuario?.id; 
  const ip = req.ip || req.socket.remoteAddress;
  const dispositivo = req.headers['user-agent'];

  void telemetryService.enviarEventosQueue({ sessionId, usuarioId, tipoUsuario, botId, ip, dispositivo, eventos })
    .catch((err) => {
      console.error('[TELEMETRY] Error encolando eventos en Redis:', err);
    });

  res.status(200).json({ success: true, message: 'Eventos registrados' });
};