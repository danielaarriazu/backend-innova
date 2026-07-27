import prisma from '../lib/prisma'; 

export const obtenerHistorialPorSesion = async (slug: string, sessionId: string) => {

  const consulta = await prisma.sesionChat.findFirst({
    where: {
      sessionId: sessionId,
      bot: {
        slug: slug,
        activo: true,
      }
    },
    select: {
      estado: true 
    }
  });

  const mensajes = await prisma.mensaje.findMany({
    where: {
      consulta: {
        sessionId: sessionId,
        bot: {
          slug: slug,
          activo: true,
        },
      }
    },
    orderBy: {
      fechaCreacion: 'asc', 
    },
  });

  return {
    estadoChat: consulta?.estado || 'BOT_ACTIVO', 
    mensajes: mensajes
  };
};