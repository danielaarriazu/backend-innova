import prisma from '../lib/prisma';

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

export const obtenerInitBot= async (slug: string) => {
  const bot = await prisma.configuracionBot.findUnique({
    where: { slug },
  });
  if (!bot || !bot.activo) {
    throw new Error('BOT_NOT_FOUND');
  }
  
  const botonesMenu= [
    {
      id: 'btn_catalogo',
      texto: 'Ver Catálogo',
      accion: 'MOSTRAR_CATALOGO'
    },
    {
      id: 'btn_horarios',
      texto: 'Horarios de Atención',
      accion: 'MOSTRAR_HORARIOS'
    },
    {
      id: 'btn_faqs',
      texto: 'Preguntas Frecuentes',
      accion: 'MOSTRAR_FAQS'
    },
    {
      id: 'btn_atencion',
      texto: 'Atención Personalizada',
      accion: 'DERIVAR_HUMANO'
    }
  ]
  return {
    botId:bot.id,
    nombre: bot.nombreNegocio || 'Asistente Virtual',
    mensajeBienvenida: bot.mensajeBienvenida || '¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?',
    botonesMenu
  };
};