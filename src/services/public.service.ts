import prisma from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

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
    }
  };
};