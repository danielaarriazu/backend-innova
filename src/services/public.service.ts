import prisma from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

const resolverNombreNegocio = (mensaje: string | null, nombre: string) =>
  mensaje?.replaceAll('{nombreNegocio}', nombre);

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
  let consultationId: string | null = null;
  
  if (finalSessionId) {
    // Buscamos si este cliente ya tenía una conversación previa
    const consultaPrevia = await prisma.consulta.findFirst({
      where: {
        sessionId: finalSessionId,
        botId: bot.id 
      },
      orderBy: { fechaActualizacion: 'desc' },
      select: { id: true },
    });

    if (consultaPrevia) {
      hasHistory = true;
      consultationId = consultaPrevia.id;
    } else {
      // Si tiene session pero no se encuentra en la BD, se inicia una nueva.
      finalSessionId = uuidv4();
    }
  } else {
    // Es la primera vez que entra al chat
    finalSessionId = uuidv4();
  }

  return {
    sessionId: finalSessionId,
    hasHistory,
    consultationId,
    botData: {
      botId: bot.id,
      nombre: bot.nombreNegocio || 'Asistente Virtual',
      descripcion: bot.descripcionBreve,
      horario: bot.horarioAtencion,
      telefono: bot.telefono,
      logo: bot.logoUrl,
      mensajeBienvenida: resolverNombreNegocio(
        bot.mensajeBienvenida,
        bot.nombreNegocio || 'tu negocio',
      ),
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
        precio: producto.precio,
        precioConsultar: producto.requiereCotizacion,
        imagen: producto.urlImagen,
        disponible: producto.activo,
      })),
    }
  };
};
