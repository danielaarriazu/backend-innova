import { Request, Response, NextFunction } from 'express';
import * as botService from '../services/bot.service';
import prisma from '../lib/prisma';


export const getBotConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const configuracion = await botService.obtenerConfiguracionBot(req.usuario!.id);
    res.status(200).json({ success: true, configuracion });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'BOT_NOT_FOUND') {
      res.status(404).json({ success: false, error: 'Configuración de bot no encontrada para este usuario.' });
      return;
    }
    next(error);
  }
};

export const updateBotConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ip = req.ip ?? req.socket.remoteAddress;
    const dispositivo = req.headers['user-agent'];

    const configuracion = await botService.actualizarConfiguracionBot({
      usuarioId: req.usuario!.id,
      ...req.body,
      ip,
      dispositivo,
    });

    res.status(200).json({
      success: true,
      message: 'Configuración del bot actualizada con éxito.',
      configuracion,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'BOT_NOT_FOUND') {
      res.status(404).json({ success: false, error: 'Configuración de bot no encontrada.' });
      return;
    }
    next(error);
  }
};

export const actualizarConfig = async (req: Request, res: Response) => {
  try {
    const ip = req.ip ?? req.socket.remoteAddress;
    const dispositivo = req.headers['user-agent'];
 
    if (req.file) {
      req.body.logoUrl = req.file.path;
    }

    const configActualizada = await botService.actualizarConfiguracionBot({
      usuarioId: req.usuario!.id,
      ...req.body,
      ip,
      dispositivo
    });

    res.json({ success: true, data: configActualizada });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la configuración' });
  }
};

export const obtenerRubros = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rubros = await prisma.rubro.findMany({
      where: { activo: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' } 
    });

    res.status(200).json({ success: true, rubros });
  } catch (error) {
    next(error);
  }
};