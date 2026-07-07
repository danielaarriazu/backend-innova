import { Request, Response, NextFunction } from 'express';
import * as faqCategoryService from '../services/faq-category.service';

const getRequestMeta = (req: Request) => ({
  ip: req.ip ?? req.socket.remoteAddress,
  dispositivo: req.headers['user-agent'] as string | undefined,
});

export const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categoria = await faqCategoryService.crearCategoria({
      usuarioId: req.usuario!.id,
      nombre: req.body.nombre,
      ...getRequestMeta(req),
    });

    res.status(201).json({ success: true, message: 'Categoría creada con éxito.', categoria });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'BOT_NOT_FOUND') {
      res.status(404).json({ success: false, error: 'Configuración de bot no encontrada.' });
      return;
    }
    next(error);
  }
};

export const getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categorias = await faqCategoryService.obtenerCategorias(req.usuario!.id);
    res.status(200).json({ success: true, categorias });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'BOT_NOT_FOUND') {
      res.status(404).json({ success: false, error: 'Configuración de bot no encontrada.' });
      return;
    }
    next(error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categoria = await faqCategoryService.actualizarCategoria({
      usuarioId: req.usuario!.id,
      categoriaId: req.params.id,
      nombre: req.body.nombre,
      ...getRequestMeta(req),
    });

    res.status(200).json({ success: true, message: 'Categoría actualizada con éxito.', categoria });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'BOT_NOT_FOUND') {
        res.status(404).json({ success: false, error: 'Configuración de bot no encontrada.' });
        return;
      }
      if (error.message === 'CATEGORY_NOT_FOUND') {
        res.status(404).json({ success: false, error: 'La categoría no existe o no pertenece a tu bot.' });
        return;
      }
    }
    next(error);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await faqCategoryService.eliminarCategoria({
      usuarioId: req.usuario!.id,
      categoriaId: req.params.id,
      ...getRequestMeta(req),
    });

    res.status(200).json({ success: true, message: 'Categoría eliminada con éxito.' });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'BOT_NOT_FOUND') {
        res.status(404).json({ success: false, error: 'Configuración de bot no encontrada.' });
        return;
      }
      if (error.message === 'CATEGORY_NOT_FOUND') {
        res.status(404).json({ success: false, error: 'La categoría no existe o no pertenece a tu bot.' });
        return;
      }
      if (error.message === 'CATEGORY_HAS_FAQS') {
        res.status(409).json({
          success: false,
          error: 'No se puede eliminar la categoría porque tiene preguntas frecuentes asociadas.',
        });
        return;
      }
    }
    next(error);
  }
};