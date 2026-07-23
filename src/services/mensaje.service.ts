import prisma from '../lib/prisma'; 

export const obtenerHistorialPorSesion = async (slug: string, sessionId: string) => {
  return await prisma.mensaje.findMany({
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
};