import prisma from '../lib/prisma';
import { registrarActividad } from './activity.service';
import { CreateFaqInput, UpdateFaqInput, DeleteFaqInput, GetFaqsInput } from '../types/faq.types';
 
const obtenerBotDeUsuario = async (usuarioId: string) => {
  const bot = await prisma.configuracionBot.findUnique({ where: { usuarioId } });
  if (!bot) throw new Error('BOT_NOT_FOUND');
  return bot;
};
 
export const crearFAQ = async (data: CreateFaqInput) => {
  const bot = await obtenerBotDeUsuario(data.usuarioId);
 
  const categoriaExiste = await prisma.categoriaFAQ.findFirst({
    where: { id: data.categoriaId, botId: bot.id }
  });
 
  if (!categoriaExiste) throw new Error('CATEGORY_NOT_FOUND');
 
  const nuevaFAQ = await prisma.faq.create({
    data: {
      botId: bot.id,
      categoriaId: data.categoriaId,
      pregunta: data.pregunta.trim(),
      respuesta: data.respuesta.trim(),
      activa: data.activa !== undefined ? data.activa : true,
      
    }
  });
 
  await registrarActividad(
    data.usuarioId,
    'CREACION_FAQ',
    `El usuario creó la FAQ: "${nuevaFAQ.pregunta}"`,
    data.ip,
    data.dispositivo
  );
 
  return nuevaFAQ;
};

export const obtenerFAQs = async (usuarioId: string, filtros: GetFaqsInput) => {
  const bot = await obtenerBotDeUsuario(usuarioId);
 
  const { categoriaId, activa, buscar, page, limit } = filtros;

  const where = {
    botId: bot.id,
    ...(categoriaId ? { categoriaId } : {}),
    ...(activa !== undefined ? { activa: activa === 'true' } : {}),
    ...(buscar && buscar.trim().length > 0
      ? {
          OR: [
            { pregunta: { contains: buscar.trim(), mode: 'insensitive' as const } },
            { respuesta: { contains: buscar.trim(), mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };
 
  const skip = (page - 1) * limit;
 
  const [faqs, total] = await prisma.$transaction([
    prisma.faq.findMany({
      where,
      include: { categoria: { select: { id: true, nombre: true } } },
      orderBy: { fechaCreacion: 'desc' },
      skip,
      take: limit,
    }),
    prisma.faq.count({ where }),
  ]);
 
  return {
    faqs,
    total,
    page,
    limit,
    totalPaginas: Math.ceil(total / limit),
  };
};

export const actualizarFAQ = async (data: UpdateFaqInput) => {
  const bot = await obtenerBotDeUsuario(data.usuarioId);

  const faqExistente = await prisma.faq.findFirst({
    where: { id: data.faqId, botId: bot.id }
  });

  if (!faqExistente) throw new Error('FAQ_NOT_FOUND');

  if (data.categoriaId) {
    const categoriaExiste = await prisma.categoriaFAQ.findFirst({
      where: { id: data.categoriaId, botId: bot.id }
    });
    if (!categoriaExiste) throw new Error('CATEGORY_NOT_FOUND');
  }

  const faqActualizada = await prisma.faq.update({
    where: { id: data.faqId },
    data: {
      categoriaId: data.categoriaId || faqExistente.categoriaId,
      pregunta: data.pregunta ? data.pregunta.trim() : faqExistente.pregunta,
      respuesta: data.respuesta ? data.respuesta.trim() : faqExistente.respuesta,
      activa: data.activa !== undefined ? data.activa : faqExistente.activa,
    }
  });

  await registrarActividad(
    data.usuarioId,
    'EDICION_FAQ',
    `El usuario editó la FAQ a: "${faqActualizada.pregunta}"`,
    data.ip,
    data.dispositivo
  );

  return faqActualizada;
};

export const eliminarFAQ = async (data: DeleteFaqInput) => {
  const bot = await obtenerBotDeUsuario(data.usuarioId);

  const faqExistente = await prisma.faq.findFirst({
    where: { id: data.faqId, botId: bot.id }
  });

  if (!faqExistente) throw new Error('FAQ_NOT_FOUND');

  await prisma.faq.delete({ where: { id: data.faqId } });

  await registrarActividad(
    data.usuarioId,
    'ELIMINACION_FAQ',
    `El usuario eliminó la FAQ: "${faqExistente.pregunta}"`,
    data.ip,
    data.dispositivo
  );
};