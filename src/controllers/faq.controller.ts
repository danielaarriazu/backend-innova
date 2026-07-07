import { Request, Response, NextFunction } from 'express';
import * as faqService from '../services/faq.service';
import { GetFaqsInput } from '../types/faq.types';

const getRequestMeta = (req: Request) => ({
  ip: req.ip ?? req.socket.remoteAddress,
  dispositivo: req.headers['user-agent'] as string | undefined,
});

export const createFAQ = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const faq = await faqService.crearFAQ({
      usuarioId: req.usuario!.id,
      ...req.body,
      ...getRequestMeta(req),
    });

    res.status(201).json({ success: true, message: 'Pregunta creada con éxito.', faq });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'BOT_NOT_FOUND') {
        res.status(404).json({ success: false, error: 'Configuración de bot no encontrada.' });
        return;
      }
      if (error.message === 'CATEGORY_NOT_FOUND') {
        res.status(404).json({ success: false, error: 'La categoría especificada no existe o no pertenece a tu bot.' });
        return;
      }
    }
    next(error);
  }
};

export const getFAQs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filtros = req.query as unknown as GetFaqsInput;
    const faqs = await faqService.obtenerFAQs(req.usuario!.id, filtros);
    res.status(200).json({ success: true, faqs });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'BOT_NOT_FOUND') {
      res.status(404).json({ success: false, error: 'Configuración de bot no encontrada.' });
      return;
    }
    next(error);
  }
};

export const updateFAQ = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const faq = await faqService.actualizarFAQ({
      usuarioId: req.usuario!.id,
      faqId: req.params.id,
      ...req.body,
      ...getRequestMeta(req),
    });

    res.status(200).json({ success: true, message: 'Pregunta actualizada con éxito.', faq });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'BOT_NOT_FOUND') {
        res.status(404).json({ success: false, error: 'Configuración de bot no encontrada.' });
        return;
      }
      if (error.message === 'FAQ_NOT_FOUND') {
        res.status(404).json({ success: false, error: 'La pregunta especificada no existe o no pertenece a tu bot.' });
        return;
      }
      if (error.message === 'CATEGORY_NOT_FOUND') {
        res.status(400).json({ success: false, error: 'La nueva categoría especificada no existe.' });
        return;
      }
    }
    next(error);
  }
};

export const deleteFAQ = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await faqService.eliminarFAQ({
      usuarioId: req.usuario!.id,
      faqId: req.params.id,
      ...getRequestMeta(req),
    });

    res.status(200).json({ success: true, message: 'Pregunta eliminada con éxito.' });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'BOT_NOT_FOUND') {
        res.status(404).json({ success: false, error: 'Configuración de bot no encontrada.' });
        return;
      }
      if (error.message === 'FAQ_NOT_FOUND') {
        res.status(404).json({ success: false, error: 'La pregunta no fue encontrada o ya fue eliminada.' });
        return;
      }
    }
    next(error);
  }
};