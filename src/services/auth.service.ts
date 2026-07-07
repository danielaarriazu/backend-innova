import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
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

  const hashedPassword = await bcryptjs.hash(data.password, 10);

  const newUser = await prisma.$transaction(async (tx) => {
  const usuarioCreado = await tx.usuario.create({
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
          respuestaDerivacion: ' Aguarda un momento, te estoy comunicando con un asesor humano para que te atienda personalmente.'
        }
      }
    },
    include: { bot: true }
  });
  if (!usuarioCreado.bot) throw new Error('BOT_CREATION_FAILED');
  
  const botId = usuarioCreado.bot.id;
  
  await tx.categoriaFAQ.create({
      data: {
        botId,
        nombre: "Precios y pagos",
        faqs: {
          create: [{
            botId,
            pregunta: "¿Cuáles son los medios de pago?",
            respuesta: "Aceptamos transferencias bancarias, tarjetas de crédito y débito a través de MercadoPago.",
            activa: true,
          }]
        }
      }
    });
 
    await tx.categoriaFAQ.create({
      data: {
        botId,
        nombre: "Productos y stock",
        faqs: {
          create: [{
            botId,
            pregunta: "¿Tienen stock disponible?",
            respuesta: "Si, contamos con stock disponible para todos nuestros productos.",
            activa: true,
          }]
        }
      }
    });
 
    await tx.categoriaFAQ.create({
      data: {
        botId,
        nombre: "Envíos",
        faqs: {
          create: [{
            botId,
            pregunta: "¿Realizan envios?",
            respuesta: "Si, hacen envíos a todo el país.",
            activa: true,
          }]
        }
      }
    });
 
    await tx.categoriaFAQ.create({
      data: {
        botId,
        nombre: "Atención y horarios",
        faqs: {
          create: [
            {
              botId,
              pregunta: "¿Cuál es el horario de atención?",
              respuesta: "Atendemos de lunes a viernes de 9 AM a 6 PM.",
              activa: true,
            },
            {
              botId,
              pregunta: "¿Aceptan cambios o devoluciones?",
              respuesta: "Sí, aceptamos cambios y devoluciones dentro de los primeros 30 días de recibido Unicamente los dias Lunes.",
              activa: true,
            }
          ]
        }
      }
    });
 
    await tx.categoriaFAQ.create({
      data: {
        botId,
        nombre: "Proceso de compra",
        faqs: {
          create: [{
            botId,
            pregunta: "¿Hacen precio por mayor?",
            respuesta: "Si, ofrecemos precios especiales para compras por mayor.",
            activa: true,
          }]
        }
      }
    });

    return usuarioCreado;
  });

  return { id: newUser.id };
};

export const iniciarSesion = async (data: LoginInput): Promise<AuthResult> => {
  if (!data.password) throw new Error('PASSWORD_REQUIRED');

  const usuario = await prisma.usuario.findUnique({ 
    where: { email: data.email },
    select: { id: true, nombre: true, email: true, rol: true, estado: true, password: true },
  });

  if (!usuario) throw new Error('INVALID_CREDENTIALS');
  if (usuario.estado !== EstadoUsuario.ACTIVO) throw new Error('ACCOUNT_INACTIVE');

  const isPasswordValid = await bcryptjs.compare(data.password, usuario.password);
  if (!isPasswordValid) throw new Error('INVALID_CREDENTIALS');

  const token = jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  await prisma.$transaction(async (tx) => {
    await tx.historialSesion.create({
      data: {
        usuarioId: usuario.id,
        ip: data.ip,
        dispositivo: data.dispositivo,
      },
    });

    await tx.usuario.update({
      where: { id: usuario.id },
      data: { ultimaSesion: new Date() },
    });

    await tx.registroActividad.create({
      data: {
        usuarioId: usuario.id,
        accion: 'LOGIN_EXITOSO',
        detalle: 'El usuario inició sesión exitosamente.',
        ip: data.ip,
        dispositivo: data.dispositivo,
      },
    });
  });

  return {
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    },
  };
};