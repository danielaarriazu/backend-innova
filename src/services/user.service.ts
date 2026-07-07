import bcryptjs from 'bcryptjs';
import prisma from '../lib/prisma';
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

  const hashedPassword = await bcryptjs.hash(data.nuevaPassword, 10);

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
  const usuario = await prisma.usuario.findUnique({
    where: { id: data.usuarioId },
    select: { id: true, password: true, estado: true },
  });

  if (!usuario || usuario.estado=== EstadoUsuario.ELIMINADO) {
    throw new Error('USER_NOT_FOUND');
  }
  
 const passwordValida = await bcryptjs.compare(data.password, usuario.password);
  if (!passwordValida) {
    throw new Error('INVALID_PASSWORD');
  }

  await prisma.$transaction(async (tx) => {
    await tx.usuario.update({
      where: { id: data.usuarioId },
      data: { estado: EstadoUsuario.ELIMINADO },
    });
 
    await tx.registroActividad.create({
      data: {
        usuarioId: data.usuarioId,
        accion: 'ELIMINACION_CUENTA',
        detalle: 'El usuario eliminó su propia cuenta',
        ip: data.ip,
        dispositivo: data.dispositivo,
      },
    });
  });
};