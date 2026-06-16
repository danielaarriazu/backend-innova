import prisma from '../db'; 

export const registrarActividad = async (
  usuarioId: string, 
  accion: string, 
  detalle: string, 
  ip: string = '127.0.0.1',
  dispositivo: string = 'Desconocido'
): Promise<void> => {
  try {
    await prisma.registroActividad.create({
      data: {
        usuarioId: usuarioId, 
        accion: accion,
        detalle: detalle,
        ip: ip,
        dispositivo: dispositivo
      }
    });
  } catch (error) {
    console.error(`Error al registrar actividad (${accion}) para el usuario ${usuarioId}:`, error);
  }
};