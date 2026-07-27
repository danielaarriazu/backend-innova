import { Request, Response, NextFunction } from 'express';
import * as publicService from '../services/public.service';

export const getProductosPublicos = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const productos = await publicService.obtenerProductosPublicos(req.params.slug);
    res.status(200).json({ success: true, productos });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'BOT_NOT_FOUND') {
      res.status(404).json({ success: false, error: 'Negocio o bot no encontrado.' });
      return;
    }
    next(error);
  }
};

export const getFAQsPublicas = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { slug } = req.params;
    const faqs = await publicService.obtenerFAQsPublicas(slug);
    
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
  // 1. Extraemos 'slug' fuera del try/catch para que sea global a toda la función
  const { slug } = req.params;

  try {
    const { sessionId } = req.query;
    const initData = await publicService.obtenerInitBot(slug, sessionId as string);
    
    // 2. Eliminé el res.json(initData) sobrante para evitar errores en Express
    res.status(200).json({ success: true, data: initData });
    
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'BOT_NOT_FOUND') {
      // Ahora 'slug' es perfectamente visible aquí
      res.status(404).json({ 
        success: false, 
        error: 'Negocio o bot no encontrado.', 
        detalleDebug: `El slug recibido fue: ${slug}` 
      });
      return;
    }
    next(error);
  }
};