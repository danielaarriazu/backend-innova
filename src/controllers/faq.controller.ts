import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { registrarActividad } from '../services/activity.service';

const prisma = new PrismaClient();

export const createFAQ = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = (req as any).usuario?.id;
    const { categoria_id, pregunta, respuesta, keywords } = req.body;

    if (!categoria_id || !pregunta || !respuesta) {
      res.status(400).json({ message: 'Los campos categoria_id, pregunta y respuesta son obligatorios.' });
      return;
    }

    const bot = await prisma.configuracionBot.findUnique({ where: { usuario_id: usuarioId } });
    if (!bot) {
      res.status(404).json({ message: 'Configuración de bot no encontrada.' });
      return;
    }

    const categoriaExiste = await prisma.categoriaFAQ.findFirst({
      where: { id: categoria_id, bot_id: bot.id }
    });

    if (!categoriaExiste) {
      res.status(404).json({ message: 'La categoría especificada no existe o no pertenece a tu bot.' });
      return;
    }

    const nuevaFAQ = await prisma.fAQ.create({
      data: {
        bot_id: bot.id,
        categoria_id,
        pregunta: pregunta.trim(),
        respuesta: respuesta.trim(),
        keywords: keywords ? keywords.trim() : null
      }
    });

    await registrarActividad(
      usuarioId,
      'CREACION_FAQ',
      `El usuario creó una nueva FAQ: "${pregunta}"`,
      req
    );

    res.status(201).json({ message: 'Pregunta frecuente creada con éxito.', faq: nuevaFAQ });
  } catch (error) {
    console.error('Error al crear FAQ:', error);
    res.status(500).json({ message: 'Error interno al crear la FAQ.' });
  }
};

export const getFAQs = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = (req as any).usuario?.id;

    const bot = await prisma.configuracionBot.findUnique({ where: { usuario_id: usuarioId } });
    if (!bot) {
      res.status(404).json({ message: 'Configuración de bot no encontrada.' });
      return;
    }

    const faqs = await prisma.fAQ.findMany({
      where: { bot_id: bot.id },
      include: {
        categoria: {
          select: { nombre: true }
        }
      },
      orderBy: { fecha_creacion: 'desc' }
    });

    res.json(faqs);
  } catch (error) {
    console.error('Error al obtener FAQs:', error);
    res.status(500).json({ message: 'Error interno al obtener las FAQs.' });
  }
};

export const updateFAQ = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = (req as any).usuario?.id;
    const { id } = req.params;
    const { categoria_id, pregunta, respuesta, keywords } = req.body;

    const bot = await prisma.configuracionBot.findUnique({ where: { usuario_id: usuarioId } });
    if (!bot) return;

    const faqExistente = await prisma.fAQ.findFirst({ 
      where: { id: id, bot_id: bot.id }
    });

    if (!faqExistente) {
      res.status(404).json({ message: 'Pregunta no encontrada o no autorizada.' });
      return;
    }

    if (categoria_id && categoria_id !== faqExistente.categoria_id) {
      const categoriaValida = await prisma.categoriaFAQ.findFirst({
        where: { id: categoria_id, bot_id: bot.id }
      });
      if (!categoriaValida) {
        res.status(400).json({ message: 'La nueva categoría es inválida.' });
        return;
      }
    }

    const faqActualizada = await prisma.fAQ.update({
      where: { id },
      data: {
        categoria_id: categoria_id || faqExistente.categoria_id,
        pregunta: pregunta ? pregunta.trim() : faqExistente.pregunta,
        respuesta: respuesta ? respuesta.trim() : faqExistente.respuesta,
        keywords: keywords !== undefined ? keywords : faqExistente.keywords // Permite borrar las keywords si se envía null/vacío
      }
    });

    await registrarActividad(
      usuarioId,
      'EDICION_FAQ',
      `El usuario editó la FAQ: "${faqActualizada.pregunta}"`,
      req
    );

    res.json({ message: 'Pregunta actualizada con éxito.', faq: faqActualizada });
  } catch (error) {
    console.error('Error al actualizar FAQ:', error);
    res.status(500).json({ message: 'Error interno al actualizar la pregunta.' });
  }
};

export const deleteFAQ = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = (req as any).usuario?.id;
    const { id } = req.params;

    const bot = await prisma.configuracionBot.findUnique({ where: { usuario_id: usuarioId } });
    if (!bot) return;

    const faqExistente = await prisma.fAQ.findFirst({
      where: { id: id, bot_id: bot.id }
    });

    if (!faqExistente) {
      res.status(404).json({ message: 'Pregunta no encontrada o no autorizada.' });
      return;
    }

    await prisma.fAQ.delete({ where: { id } });

    await registrarActividad(
      usuarioId,
      'ELIMINACION_FAQ',
      `El usuario eliminó la FAQ: "${faqExistente.pregunta}"`,
      req
    );

    res.json({ message: 'Pregunta eliminada con éxito.' });
  } catch (error) {
    console.error('Error al eliminar FAQ:', error);
    res.status(500).json({ message: 'Error interno al eliminar la pregunta.' });
  }
};