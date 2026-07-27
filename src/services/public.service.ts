import prisma from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

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
    where: { 
      botId: bot.id, 
      activa: true 
    },
    include: { 
      categoria: { select: { id: true, nombre: true } } 
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

  let hasHistory = false;
  let finalSessionId = sessionId;
  
  if (finalSessionId) {
    // Buscamos si este cliente ya tenía una conversación previa
    const consultaPrevia = await prisma.consulta.findFirst({
      where: {
        sessionId: finalSessionId,
        botId: bot.id 
      }
    });

    if (consultaPrevia) {
      hasHistory = true; 
      finalSessionId = uuidv4(); 
    }
  } else {
    // Es la primera vez que entra al chat
    finalSessionId = uuidv4();
  }
  return {
    sessionId: finalSessionId,
    hasHistory,
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
        disponible: producto.activo && producto.stock !== 0,
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
