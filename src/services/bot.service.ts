import prisma from '../lib/prisma';
import { registrarActividad } from './activity.service';
import { UpdateBotInput } from '../types/bot.types';

export const obtenerConfiguracionBot = async (usuarioId: string) => {
  const bot = await prisma.configuracionBot.findUnique({
    where: { usuarioId }
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

  const botActualizado = await prisma.configuracionBot.update({
    where: { usuarioId: data.usuarioId },
    data: {
      activo: data.activo,
      nombreNegocio: data.nombreNegocio?.trim(),
      rubroId: data.rubroId,
      descripcionBreve: data.descripcionBreve?.trim(),
      horarioAtencion: data.horarioAtencion?.trim(),
      telefono: data.telefono?.trim(),
      respuestaDerivacion: data.respuestaDerivacion?.trim(),
      logoUrl: data.logoUrl?.trim(),
      mensajeBienvenida: data.mensajeBienvenida?.trim(),
      mensajeFueraHorario: data.mensajeFueraHorario?.trim(),
      derivacionAutomatica: data.derivacionAutomatica
    }
  });

  await registrarActividad(
    data.usuarioId,
    'EDICION_CONFIGURACION_BOT',
    'El usuario actualizó la configuración general de su bot.',
    data.ip,
    data.dispositivo
  );

  return botActualizado;
};