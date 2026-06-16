import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db';
import { registrarActividad } from './activity.service';
import { RegisterInput, LoginInput, AuthResult } from '../types/auth.types';
import { EstadoUsuario } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET no está configurado en el archivo .env');
  process.exit(1); 
}

export const registrarUsuario = async (data: RegisterInput): Promise<{ id: string }> => {
  if (!data.password) throw new Error('PASSWORD_REQUIRED');

  const existingUser = await prisma.usuario.findUnique({ where: { email: data.email } });
  if (existingUser) throw new Error('EMAIL_ALREADY_REGISTERED');

  const saltRounds = 10;
  const hashedPassword = await bcryptjs.hash(data.password, saltRounds);

  const newUser = await prisma.usuario.create({
    data: {
      nombre: data.nombre,
      email: data.email,
      password: hashedPassword,
      rol: 'EMPRENDEDOR',
      estado: 'ACTIVO',
      bot: {
        create: {
          nombreNegocio: data.nombreNegocio || data.nombre,
          activo: true,
          mensajeBienvenida: `¡Hola! Bienvenido/a a ${data.nombreNegocio || data.nombre}. ¿En qué te puedo ayudar hoy?`,
        }
      }
    },
  });

  return { id: newUser.id };
};

export const iniciarSesion = async (data: LoginInput): Promise<AuthResult> => {
  if (!data.password) throw new Error('PASSWORD_REQUIRED');

  const usuario = await prisma.usuario.findUnique({ where: { email: data.email } });
  if (!usuario) throw new Error('INVALID_CREDENTIALS');
  if (usuario.estado !== EstadoUsuario.ACTIVO) throw new Error('ACCOUNT_INACTIVE');

  const isPasswordValid = await bcryptjs.compare(data.password, usuario.password);
  if (!isPasswordValid) throw new Error('INVALID_CREDENTIALS');

  const token = jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  await prisma.historialSesion.create({
    data: {
      usuarioId: usuario.id,
      ip: data.ip,
      dispositivo: data.dispositivo
    }
  });

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { ultimaSesion: new Date() }
  });

  await registrarActividad(
    usuario.id,
    'LOGIN_EXITOSO',
    'El usuario inició sesión exitosamente.',
    data.ip,
    data.dispositivo
  );

  return {
    token,
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }
  };
};