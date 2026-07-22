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

    if (req.body.activo === 'true') req.body.activo = true;
    if (req.body.activo === 'false') req.body.activo = false;
    if (req.body.derivacionAutomatica === 'true') req.body.derivacionAutomatica = true;
    if (req.body.derivacionAutomatica === 'false') req.body.derivacionAutomatica = false;

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

export const actualizarSlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const slug = await botService.actualizarSlugBot({
      usuarioId: req.usuario!.id,
      slug: req.body.slug,
      ip: req.ip ?? req.socket.remoteAddress,
      dispositivo: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message: 'Enlace público actualizado con éxito.',
      slug,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'BOT_NOT_FOUND') {
      res.status(404).json({ success: false, error: 'Configuración de bot no encontrada.' });
      return;
    }
    if (error instanceof Error && error.message === 'SLUG_EDIT_ALREADY_USED') {
      res.status(409).json({
        success: false,
        code: 'SLUG_EDIT_ALREADY_USED',
        field: 'slug',
        error: 'El enlace público ya fue personalizado y no puede volver a modificarse.',
      });
      return;
    }
    next(error);
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
