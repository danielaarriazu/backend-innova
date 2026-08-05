import prisma from '../lib/prisma';
import { resolveChatSession } from './chat-session-init.service';

export const obtenerProductosPublicos = async (slug: string) => {
  const bot = await prisma.configuracionBot.findUnique({
    where: { slug },
  });

  if (!bot || !bot.activo) {
    throw new Error('BOT_NOT_FOUND');
  }

  const productos = await prisma.producto.findMany({
    where: { botId: bot.id, activo: true },
    orderBy: { fechaCreacion: 'desc' },
  });

  return productos;
};

export const obtenerFAQsPublicas = async (slug: string) => {
  const bot = await prisma.configuracionBot.findUnique({
    where: { slug },
  });

  if (!bot || !bot.activo) {
    throw new Error('BOT_NOT_FOUND');
  }

  const faqs = await prisma.faq.findMany({
    where: { botId: bot.id },
    select: {
      id: true,
      botId: true,
      categoriaId: true,
      pregunta: true,
      respuesta: true,
      fechaCreacion: true,
      fechaModificacion: true,
      categoria: { select: { id: true, nombre: true } },
    },
    orderBy: { pregunta: 'asc' }, 
  });

  return faqs;
};

export const obtenerInitBot= async (slug: string, sessionId?: string) => {
  const bot = await prisma.configuracionBot.findUnique({
    where: { slug },
    include: {
      rubro: { select: { id: true, nombre: true } },
      productos: {
        where: { activo: true },
        orderBy: { fechaCreacion: 'desc' },
      },
    },
  });
  if (!bot || !bot.activo) {
    throw new Error('BOT_NOT_FOUND');
  }

  let lifecycleEvent: 'SESSION_EXPIRED_INACTIVITY' | null = null;
  if (sessionId) {
    const consultaPrevia = await prisma.consulta.findFirst({
      where: { botId: bot.id, sessionId },
      select: { MotivoCierre: true },
    });
    if (consultaPrevia?.MotivoCierre === 'INACTIVIDAD') {
      lifecycleEvent = 'SESSION_EXPIRED_INACTIVITY';
    }
  }

  const { sessionId: finalSessionId, hasHistory } = await resolveChatSession({
    botId: bot.id,
    requestedSessionId: sessionId,
    repository: {
      hasPreviousConsultation: async (botId, requestedSessionId) => {
        const consultaPrevia = await prisma.consulta.findFirst({
          where: { botId, sessionId: requestedSessionId },
          select: { id: true },
        });
        return Boolean(consultaPrevia);
      },
      ensureSession: async (botId, sessionIdToEnsure) => {
        await prisma.sesionChat.upsert({
          where: {
            botId_sessionId: {
              botId,
              sessionId: sessionIdToEnsure,
            },
          },
          update: {},
          create: {
            botId,
            sessionId: sessionIdToEnsure,
            estado: 'BOT_ACTIVO',
            contexto: 'INICIO',
          },
        });
      },
    },
  });
  return {
    sessionId: finalSessionId,
    hasHistory,
    lifecycleEvent,
    botData: {
      botId: bot.id,
      nombre: bot.nombreNegocio || 'Asistente Virtual',
      descripcion: bot.descripcionBreve,
      horario: bot.horarioAtencion,
      telefono: bot.telefono,
      logo: bot.logoUrl,
      mensajeBienvenida: bot.mensajeBienvenida || '¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?',
      respuestaDerivacion: bot.respuestaDerivacion,
      colorPrimario: bot.colorPrimario,
      colorSecundario: bot.colorSecundario,
      rubroId: bot.rubroId,
      rubroNombre: bot.rubro?.nombre,
      slug: bot.slug,
      productos: bot.productos.map((producto) => ({
        id: producto.id,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: Number(producto.precio),
        precioConsultar: producto.requiereCotizacion,
        imagen: producto.urlImagen,
        disponible: producto.activo,
      })),
    },
    // Campos planos conservados para clientes que consumían el contrato anterior.
    botId: bot.id,
    nombre: bot.nombreNegocio || 'Asistente Virtual',
    mensajeBienvenida: bot.mensajeBienvenida || '¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?',
    colorPrimario: bot.colorPrimario,
    colorSecundario: bot.colorSecundario,
  };
};
