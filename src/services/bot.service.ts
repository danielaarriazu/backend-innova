import prisma from '../lib/prisma';
import { registrarActividad } from './activity.service';
import { UpdateBotInput, UpdateSlugInput } from '../types/bot.types';
import { esConflictoSlug, generarSlug, generarSlugUnico } from '../utils/slug';

export const obtenerConfiguracionBot = async (usuarioId: string) => {
  const bot = await prisma.configuracionBot.findUnique({
    where: { usuarioId }
  });

  if (!bot) {
    throw new Error('BOT_NOT_FOUND');
  }

  return bot;
};

export const actualizarConfiguracionBot = async (data: UpdateBotInput) => {
  const botExistente = await prisma.configuracionBot.findUnique({
    where: { usuarioId: data.usuarioId }
  });

  if (!botExistente) {
    throw new Error('BOT_NOT_FOUND');
  }

  const textoBaseSlug = data.nombreNegocio?.trim() || botExistente.nombreNegocio || 'negocio';
  let slugParaAsignar = botExistente.slug
    ? undefined
    : await generarSlugUnico(textoBaseSlug);

  const actualizarBot = (slug?: string) => prisma.configuracionBot.update({
    where: { usuarioId: data.usuarioId },
    data: {
      activo: data.activo,
      nombreNegocio: data.nombreNegocio?.trim(),
      ...(slug ? { slug } : {}),
      rubroId: data.rubroId,
      descripcionBreve: data.descripcionBreve?.trim(),
      horarioAtencion: data.horarioAtencion?.trim(),
      telefono: data.telefono?.trim(),
      respuestaDerivacion: data.respuestaDerivacion?.trim(),
      logoUrl: data.logoUrl?.trim(),
      mensajeBienvenida: data.mensajeBienvenida?.trim(),
      mensajeFueraHorario: data.mensajeFueraHorario?.trim(),
      derivacionAutomatica: data.derivacionAutomatica
    }
  });

  let botActualizado: Awaited<ReturnType<typeof actualizarBot>>;
  try {
    botActualizado = await actualizarBot(slugParaAsignar);
  } catch (error) {
    if (!slugParaAsignar || !esConflictoSlug(error)) throw error;

    slugParaAsignar = await generarSlugUnico(textoBaseSlug);
    botActualizado = await actualizarBot(slugParaAsignar);
  }

  await registrarActividad(
    data.usuarioId,
    'EDICION_CONFIGURACION_BOT',
    'El usuario actualizó la configuración general de su bot.',
    data.ip,
    data.dispositivo
  );

  return botActualizado;
};

export const actualizarSlugBot = async (data: UpdateSlugInput) => {
  const botExistente = await prisma.configuracionBot.findUnique({
    where: { usuarioId: data.usuarioId },
    select: { id: true },
  });

  if (!botExistente) {
    throw new Error('BOT_NOT_FOUND');
  }

  const slug = generarSlug(data.slug);
  const botActualizado = await prisma.configuracionBot.update({
    where: { usuarioId: data.usuarioId },
    data: { slug },
    select: { slug: true },
  });

  await registrarActividad(
    data.usuarioId,
    'EDICION_SLUG_BOT',
    `El usuario actualizó el enlace público de su bot a "${slug}".`,
    data.ip,
    data.dispositivo
  );

  return botActualizado.slug;
};
