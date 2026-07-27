import prisma from '../lib/prisma';
import { registrarActividad } from './activity.service';
import { UpdateBotInput, UpdateSlugInput } from '../types/bot.types';
import { esConflictoSlug, generarSlug, generarSlugUnico } from '../utils/slug';

const mensajeBienvenidaAutomatico = (nombre: string) =>
  `¡Hola! Soy el asistente de ${nombre} ¿En qué te puedo ayudar? Elige una opción para continuar.`;

const resolverMensajeBienvenida = (
  mensajeEntrante: string | undefined,
  nombreEntrante: string | undefined,
  nombreAnterior: string | null,
  mensajeAnterior: string | null,
) => {
  if (mensajeEntrante === undefined) return undefined;

  const mensaje = mensajeEntrante.trim();
  const nuevoNombre = nombreEntrante?.trim();
  const mensajeAnteriorEraAutomatico = Boolean(
    !mensajeAnterior?.trim()
    || mensajeAnterior.trim() === '¡Hola! ¿En qué te puedo ayudar?'
    || mensajeAnterior.trim() === '¡Hola! ¿En qué te puedo ayudar hoy?'
    || nombreAnterior && mensajeAnterior.trim() === mensajeBienvenidaAutomatico(nombreAnterior),
  );

  if (
    nuevoNombre
    && (
      mensaje.includes('{nombreNegocio}')
      || mensajeAnteriorEraAutomatico && mensaje === mensajeAnterior?.trim()
    )
  ) {
    return mensajeBienvenidaAutomatico(nuevoNombre);
  }

  return mensaje;
};

export const obtenerConfiguracionBot = async (usuarioId: string) => {
  const bot = await prisma.configuracionBot.findUnique({
    where: { usuarioId },
    include: {
      rubro: {
        select: {
          id: true,
          nombre: true,
        },
      },
    },
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
  const mensajeBienvenida = resolverMensajeBienvenida(
    data.mensajeBienvenida,
    data.nombreNegocio,
    botExistente.nombreNegocio,
    botExistente.mensajeBienvenida,
  );
  let slugParaAsignar = botExistente.slug
    ? undefined
    : await generarSlugUnico(textoBaseSlug);

  const actualizarBot = (slug?: string) => prisma.configuracionBot.update({
    where: { usuarioId: data.usuarioId },
    data: {
      activo: true,
      nombreNegocio: data.nombreNegocio?.trim(),
      ...(slug ? { slug } : {}),
      rubroId: data.rubroId,
      descripcionBreve: data.descripcionBreve?.trim(),
      horarioAtencion: data.horarioAtencion?.trim(),
      telefono: data.telefono?.trim(),
      respuestaDerivacion: data.respuestaDerivacion?.trim(),
      logoUrl: data.logoUrl?.trim(),
      mensajeBienvenida,
      mensajeFueraHorario: data.mensajeFueraHorario?.trim(),
      derivacionAutomatica: data.derivacionAutomatica,
      colorPrimario: data.colorPrimario,
      colorSecundario: data.colorSecundario,
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
    select: { slug: true, slugPersonalizado: true },
  });

  if (!botExistente) {
    throw new Error('BOT_NOT_FOUND');
  }

  const slug = generarSlug(data.slug);

  if (slug === botExistente.slug) {
    return slug;
  }

  if (botExistente.slugPersonalizado) {
    throw new Error('SLUG_EDIT_ALREADY_USED');
  }

  const resultado = await prisma.configuracionBot.updateMany({
    where: { usuarioId: data.usuarioId, slugPersonalizado: false },
    data: { slug, slugPersonalizado: true, slugEditadoEn: new Date() },
  });

  if (resultado.count !== 1) {
    throw new Error('SLUG_EDIT_ALREADY_USED');
  }

  await registrarActividad(
    data.usuarioId,
    'EDICION_SLUG_BOT',
    `El usuario actualizó el enlace público de su bot a "${slug}".`,
    data.ip,
    data.dispositivo
  );

  return slug;
};

export const cambiarEstadoBot = async (slug: string, nuevoEstado: boolean) => {
  const bot = await prisma.configuracionBot.findUnique({
    where: { slug: slug },
  });

  if (!bot) {
    throw new Error('BOT_NOT_FOUND');
  }

  const botActualizado = await prisma.configuracionBot.update({
    where: { slug: slug },
    data: { activo: nuevoEstado },
  });

  return botActualizado;
};
