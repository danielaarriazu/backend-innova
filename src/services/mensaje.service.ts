import prisma from '../lib/prisma'; 

export const obtenerHistorialPorSesion = async (botId: string, sessionId: string) => {
  return await prisma.mensaje.findMany({
    where: {
      consulta: {
        botId: botId,
        sessionId: sessionId,
      }
    },
    orderBy: {
      fechaCreacion: 'asc', 
    },
  });
};