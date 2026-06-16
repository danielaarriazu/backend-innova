import bcryptjs from 'bcryptjs';
import prisma from '../db';
import { registrarActividad } from './activity.service';
import { ChangePasswordInput, DeleteAccountInput } from '../types/user.types';
import { EstadoUsuario } from '@prisma/client';

export const cambiarPassword = async (data: ChangePasswordInput): Promise<void> => {
  const usuario = await prisma.usuario.findUnique({ where: { id: data.usuarioId } });
  
  if (!usuario || usuario.estado === EstadoUsuario.ELIMINADO) {
    throw new Error('USER_NOT_FOUND');
  }

  const isPasswordValid = await bcryptjs.compare(data.passwordActual, usuario.password);
  if (!isPasswordValid) {
    throw new Error('INVALID_CURRENT_PASSWORD');
  }

  const saltRounds = 10;
  const hashedPassword = await bcryptjs.hash(data.nuevaPassword, saltRounds);

  await prisma.usuario.update({
    where: { id: data.usuarioId },
    data: { password: hashedPassword }
  });

  await registrarActividad(
    data.usuarioId, 
    'CAMBIO_CONTRASEÑA', 
    'El usuario cambió su contraseña exitosamente.', 
    data.ip,
    data.dispositivo
  );
};

export const eliminarCuenta = async (data: DeleteAccountInput): Promise<void> => {
  const usuario = await prisma.usuario.findUnique({ where: { id: data.usuarioId } });
  
  if (!usuario || usuario.estado === EstadoUsuario.ELIMINADO) {
    throw new Error('USER_NOT_FOUND');
  }

  await prisma.usuario.update({
    where: { id: data.usuarioId },
    data: { estado: EstadoUsuario.ELIMINADO }
  });

  await registrarActividad(
    data.usuarioId,
    'ELIMINACION_CUENTA',
    'El usuario eliminó su cuenta lógicamente.',
    data.ip,
    data.dispositivo
  );
};