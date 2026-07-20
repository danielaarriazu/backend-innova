import { Request, Response, NextFunction } from 'express';
import * as publicService from '../services/public.service';
import { obtenerInitBot } from '../services/public.service';

export const getFAQsPublicas = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const faqs = await publicService.obtenerFAQsPublicas(req.params.slug);
    
    res.status(200).json({ success: true, faqs });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'BOT_NOT_FOUND') {
      res.status(404).json({ success: false, error: 'Negocio o bot no encontrado.' });
      return;
    }
    next(error);
  }
};
export const getChatInit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { slug } = req.params;
    const initData = await obtenerInitBot(slug);
    
    res.status(200).json({ success: true, data: initData });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'BOT_NOT_FOUND') {
      res.status(404).json({ success: false, error: 'Negocio o bot no encontrado.' });
      return;
    }
    next(error);
  }
};