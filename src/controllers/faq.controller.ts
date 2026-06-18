import { Request, Response, NextFunction } from 'express';
import * as faqService from '../services/faq.service';

export const createFAQ = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const usuarioId = req.usuario?.id;
    const { categoriaId, pregunta, respuesta, keywords } = req.body;

    if (!usuarioId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    if (!categoriaId || !pregunta || !respuesta) {
      res.status(400).json({ error: 'Los campos categoriaId, pregunta y respuesta son obligatorios.' });
      return;
    }

    const ip = req.ip || req.socket.remoteAddress;
    const dispositivo = req.headers['user-agent'];

    const faq = await faqService.crearFAQ({ usuarioId, categoriaId, pregunta, respuesta, keywords, ip, dispositivo });

    res.status(201).json({ success: true, message: 'Pregunta creada con éxito.', faq });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'BOT_NOT_FOUND') {
        res.status(404).json({ error: 'Configuración de bot no encontrada.' });
        return;
      }
      if (error.message === 'CATEGORY_NOT_FOUND') {
        res.status(404).json({ error: 'La categoría especificada no existe o no pertenece a tu bot.' });
        return;
      }
    }
    next(error);
  }
};

export const getFAQs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const usuarioId = req.usuario?.id;
    
    if (!usuarioId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    const faqs = await faqService.obtenerFAQs(usuarioId);
    res.status(200).json({ success: true, faqs });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'BOT_NOT_FOUND') {
      res.status(404).json({ error: 'Configuración de bot no encontrada.' });
      return;
    }
    next(error);
  }
};

export const updateFAQ = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const usuarioId = req.usuario?.id;
    const faqId = req.params.id;
    const { categoriaId, pregunta, respuesta, keywords } = req.body;

    if (!usuarioId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    const ip = req.ip || req.socket.remoteAddress;
    const dispositivo = req.headers['user-agent'];

    const faq = await faqService.actualizarFAQ({ usuarioId, faqId, categoriaId, pregunta, respuesta, keywords, ip, dispositivo });

    res.status(200).json({ success: true, message: 'Pregunta actualizada con éxito.', faq });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'BOT_NOT_FOUND') {
        res.status(404).json({ error: 'Configuración de bot no encontrada.' });
        return;
      }
      if (error.message === 'FAQ_NOT_FOUND') {
        res.status(404).json({ error: 'La pregunta especificada no existe o no pertenece a tu bot.' });
        return;
      }
      if (error.message === 'CATEGORY_NOT_FOUND') {
        res.status(400).json({ error: 'La nueva categoría especificada no existe.' });
        return;
      }
    }
    next(error);
  }
};

export const deleteFAQ = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const usuarioId = req.usuario?.id;
    const faqId = req.params.id;

    if (!usuarioId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    const ip = req.ip || req.socket.remoteAddress;
    const dispositivo = req.headers['user-agent'];

    await faqService.eliminarFAQ({ usuarioId, faqId, ip, dispositivo });

    res.status(200).json({ success: true, message: 'Pregunta eliminada con éxito.' });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'BOT_NOT_FOUND') {
        res.status(404).json({ error: 'Configuración de bot no encontrada.' });
        return;
      }
      if (error.message === 'FAQ_NOT_FOUND') {
        res.status(404).json({ error: 'La pregunta no fue encontrada o ya fue eliminada.' });
        return;
      }
    }
    next(error);
  }
};