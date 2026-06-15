import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { registrarActividad } from '../services/activity.service';

const prisma = new PrismaClient();

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = (req as any).usuario?.id;
    const { nombre } = req.body;

    if (!nombre || nombre.trim() === '') {
      res.status(400).json({ message: 'El nombre de la categoría es obligatorio.' });
      return;
    }

    const bot = await prisma.configuracionBot.findUnique({ where: { usuario_id: usuarioId } });
    if (!bot) {
      res.status(404).json({ message: 'Configuración de bot no encontrada.' });
      return;
    }

    const nuevaCategoria = await prisma.categoriaFAQ.create({
      data: {
        bot_id: bot.id,
        nombre: nombre.trim()
      }
    });

    await registrarActividad(
      usuarioId,
      'CREACION_CATEGORIA_FAQ',
      `El usuario creó la categoría de FAQ: "${nombre}"`,
      req
    );

    res.status(201).json({ message: 'Categoría creada con éxito.', categoria: nuevaCategoria });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({ message: 'Error interno al crear la categoría.' });
  }
};

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = (req as any).usuario?.id;

    const bot = await prisma.configuracionBot.findUnique({ where: { usuario_id: usuarioId } });
    if (!bot) {
      res.status(404).json({ message: 'Configuración de bot no encontrada.' });
      return;
    }

    const categorias = await prisma.categoriaFAQ.findMany({
      where: { bot_id: bot.id },
      orderBy: { fecha_creacion: 'asc' }
    });

    res.json(categorias);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ message: 'Error interno al obtener las categorías.' });
  }
};
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const usuarioId = (req as any).usuario?.id; 
        const { id } = req.params;
        const { nombre } = req.body;

        if (!nombre || nombre.trim() === '') {
            res.status(400).json({ message: 'El nombre de la categoría es obligatorio.' });
            return;
        }  

        const bot = await prisma.configuracionBot.findUnique({ where: { usuario_id: usuarioId } });
        if (!bot) {
            res.status(404).json({ message: 'Configuración de bot no encontrada.' });
            return;
        }

        const categoriaExistente = await prisma.categoriaFAQ.findFirst({
            where: { id, bot_id: bot.id }
        });

        if (!categoriaExistente) {
            res.status(404).json({ message: 'La categoría especificada no existe o no pertenece a tu bot.' });
            return;
        }

        const categoriaActualizada = await prisma.categoriaFAQ.update({
            where: { id, bot_id: bot.id },
            data: { nombre: nombre.trim() }
        });

        await registrarActividad(
            usuarioId,
            'ACTUALIZACION_CATEGORIA_FAQ',
            `El usuario actualizó la categoría "${categoriaExistente.nombre}" a "${categoriaActualizada.nombre}"`,
            req
        );

        res.json({ message: 'Categoría actualizada con éxito.', categoria: categoriaActualizada });
    } catch (error) {
        console.error('Error al actualizar categoría:', error);
        res.status(500).json({ message: 'Error interno al actualizar la categoría.' });
    }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = (req as any).usuario?.id;
    const { id } = req.params;

    const bot = await prisma.configuracionBot.findUnique({ where: { usuario_id: usuarioId } });
    if (!bot) {
      res.status(404).json({ message: 'Configuración de bot no encontrada.' });
      return;
    }
    const categoriaExistente = await prisma.categoriaFAQ.findFirst({
      where: { id, bot_id: bot.id }
    });

    if (!categoriaExistente) {
      res.status(404).json({ message: 'La categoría especificada no existe o no pertenece a tu bot.' });
      return;
    }

    const faqsAsociadas = await prisma.fAQ.findMany({
      where: { categoria_id: id }
    }); 

    if (faqsAsociadas.length > 0) {
        res.status(400).json({ message: 'No se puede eliminar la categoría porque tiene preguntas frecuentes asociadas. Elimina o reasigna esas preguntas antes de eliminar la categoría.' }); 
        return;
    }

    await prisma.categoriaFAQ.delete({ where: { id, bot_id: bot.id } });

    await registrarActividad(
      usuarioId,
      'ELIMINACION_CATEGORIA_FAQ',
      `El usuario eliminó la categoría "${categoriaExistente.nombre}"`,
      req
    );

    res.json({ message: 'Categoría eliminada con éxito.' });
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    res.status(500).json({ message: 'Error interno al eliminar la categoría.' });
  } 
};