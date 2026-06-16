import { Request, Response, NextFunction } from 'express';
import * as faqCategoryService from '../services/faq-category.service';

export const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const usuarioId = req.usuario?.id;
    const { nombre } = req.body;

    if (!usuarioId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    if (!nombre || nombre.trim() === '') {
      res.status(400).json({ error: 'El nombre de la categoría es obligatorio.' });
      return;
    }

    const ip = req.ip || req.socket.remoteAddress;
    const dispositivo = req.headers['user-agent'];

    const categoria = await faqCategoryService.crearCategoria({ usuarioId, nombre, ip, dispositivo });

    res.status(201).json({ success: true, message: 'Categoría creada con éxito.', categoria });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'BOT_NOT_FOUND') {
      res.status(404).json({ error: 'Configuración de bot no encontrada.' });
      return;
    }
    next(error);
  }
};

export const getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const usuarioId = req.usuario?.id;
    if (!usuarioId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    const categorias = await faqCategoryService.obtenerCategorias(usuarioId);
    res.status(200).json({ success: true, categorias });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'BOT_NOT_FOUND') {
      res.status(404).json({ error: 'Configuración de bot no encontrada.' });
      return;
    }
    next(error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const usuarioId = req.usuario?.id;
    const categoriaId = req.params.id;
    const { nombre } = req.body;

    if (!usuarioId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    if (!nombre || nombre.trim() === '') {
      res.status(400).json({ error: 'El nombre de la categoría es obligatorio.' });
      return;
    }

    const ip = req.ip || req.socket.remoteAddress;
    const dispositivo = req.headers['user-agent'];

    const categoria = await faqCategoryService.actualizarCategoria({ usuarioId, categoriaId, nombre, ip, dispositivo });

    res.status(200).json({ success: true, message: 'Categoría actualizada con éxito.', categoria });
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

export const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const usuarioId = req.usuario?.id;
    const categoriaId = req.params.id;

    if (!usuarioId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    const ip = req.ip || req.socket.remoteAddress;
    const dispositivo = req.headers['user-agent'];

    await faqCategoryService.eliminarCategoria({ usuarioId, categoriaId, ip, dispositivo });

    res.status(200).json({ success: true, message: 'Categoría eliminada con éxito.' });
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
      if (error.message === 'CATEGORY_HAS_FAQS') {
        res.status(400).json({ error: 'No se puede eliminar la categoría porque tiene preguntas frecuentes asociadas.' });
        return;
      }
    }
    next(error);
  }
};