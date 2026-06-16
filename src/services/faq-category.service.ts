import prisma from '../lib/prisma';
import { registrarActividad } from './activity.service';
import { CreateCategoryInput, UpdateCategoryInput, DeleteCategoryInput } from '../types/faq-category.types';

const obtenerBotDeUsuario = async (usuarioId: string) => {
  const bot = await prisma.configuracionBot.findUnique({ where: { usuarioId } });
  if (!bot) throw new Error('BOT_NOT_FOUND');
  return bot;
};

export const crearCategoria = async (data: CreateCategoryInput) => {
  const bot = await obtenerBotDeUsuario(data.usuarioId);

  const nuevaCategoria = await prisma.categoriaFAQ.create({
    data: {
      botId: bot.id,
      nombre: data.nombre.trim()
    }
  });

  await registrarActividad(
    data.usuarioId,
    'CREACION_CATEGORIA_FAQ',
    `El usuario creó la categoría de FAQ: "${data.nombre}"`,
    data.ip,
    data.dispositivo
  );

  return nuevaCategoria;
};

export const obtenerCategorias = async (usuarioId: string) => {
  const bot = await obtenerBotDeUsuario(usuarioId);

  return await prisma.categoriaFAQ.findMany({
    where: { botId: bot.id },
    orderBy: { fechaCreacion: 'desc' }
  });
};

export const actualizarCategoria = async (data: UpdateCategoryInput) => {
  const bot = await obtenerBotDeUsuario(data.usuarioId);

  const categoriaExistente = await prisma.categoriaFAQ.findFirst({
    where: { id: data.categoriaId, botId: bot.id }
  });

  if (!categoriaExistente) throw new Error('CATEGORY_NOT_FOUND');

  const categoriaActualizada = await prisma.categoriaFAQ.update({
    where: { id: data.categoriaId },
    data: { nombre: data.nombre.trim() }
  });

  await registrarActividad(
    data.usuarioId,
    'EDICION_CATEGORIA_FAQ',
    `El usuario editó la categoría de FAQ a: "${data.nombre}"`,
    data.ip,
    data.dispositivo
  );

  return categoriaActualizada;
};

export const eliminarCategoria = async (data: DeleteCategoryInput) => {
  const bot = await obtenerBotDeUsuario(data.usuarioId);

  const categoriaExistente = await prisma.categoriaFAQ.findFirst({
    where: { id: data.categoriaId, botId: bot.id }
  });

  if (!categoriaExistente) throw new Error('CATEGORY_NOT_FOUND');

  const faqsAsociadas = await prisma.faq.findMany({
    where: { categoriaId: data.categoriaId }
  });

  if (faqsAsociadas.length > 0) throw new Error('CATEGORY_HAS_FAQS');

  await prisma.categoriaFAQ.delete({ where: { id: data.categoriaId } });

  await registrarActividad(
    data.usuarioId,
    'ELIMINACION_CATEGORIA_FAQ',
    `El usuario eliminó la categoría de FAQ: "${categoriaExistente.nombre}"`,
    data.ip,
    data.dispositivo
  );
};