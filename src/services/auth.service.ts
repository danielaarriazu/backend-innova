import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { registrarActividad } from './activity.service';
import { RegisterInput, LoginInput, AuthResult } from '../types/auth.types';
import { EstadoUsuario } from '@prisma/client';
import { esConflictoSlug, generarSlugUnico } from '../utils/slug';
import { OAuth2Client } from 'google-auth-library';
import { randomUUID } from 'node:crypto';
import type { GoogleLoginInput } from '../types/auth.types';

const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET no está configurado en el archivo .env');
  process.exit(1); 
}

export const registrarUsuario = async (data: RegisterInput): Promise<{ id: string }> => {
  if (!data.password) throw new Error('PASSWORD_REQUIRED');

  const existingUser = await prisma.usuario.findUnique({ where: { email: data.email } });
  if (existingUser) throw new Error('EMAIL_ALREADY_REGISTERED');

  const hashedPassword = await bcryptjs.hash(data.password, 10);
  const textoBaseSlug = data.nombreNegocio || data.nombre;
  const slugInicial = await generarSlugUnico(textoBaseSlug);

  const crearUsuarioConBot = async (slug: string) => prisma.$transaction(async (tx) => {
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
          slug,
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
            activa: false,
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
            activa: false,
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
            activa: false,
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
              activa: false,
            },
            {
              botId,
              pregunta: "¿Aceptan cambios o devoluciones?",
              respuesta: "Sí, aceptamos cambios y devoluciones dentro de los primeros 30 días de recibido Unicamente los dias Lunes.",
              activa: false,
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
            activa: false,
          }]
        }
      }
    });

    return usuarioCreado;
  });

  let newUser: Awaited<ReturnType<typeof crearUsuarioConBot>>;
  try {
    newUser = await crearUsuarioConBot(slugInicial);
  } catch (error) {
    if (!esConflictoSlug(error)) throw error;

    const slugReintento = await generarSlugUnico(textoBaseSlug);
    newUser = await crearUsuarioConBot(slugReintento);
  }

  return { id: newUser.id };
};

export const iniciarSesion = async (data: LoginInput): Promise<AuthResult> => {
  if (!data.email) throw new Error('EMAIL_REQUIRED');
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

export const iniciarSesionGoogle = async (data: GoogleLoginInput): Promise<AuthResult> => {
  if (!googleClient || !GOOGLE_CLIENT_ID) throw new Error('GOOGLE_AUTH_NOT_CONFIGURED');

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: data.credential,
      audience: GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    throw new Error('INVALID_GOOGLE_CREDENTIAL');
  }

  if (!payload?.sub || !payload.email || !payload.email_verified) {
    throw new Error('INVALID_GOOGLE_CREDENTIAL');
  }

  const email = payload.email.toLowerCase();
  let usuario = await prisma.usuario.findFirst({
    where: {
      OR: [{ googleId: payload.sub }, { email }],
    },
  });

  if (usuario?.googleId && usuario.googleId !== payload.sub) {
    throw new Error('INVALID_GOOGLE_CREDENTIAL');
  }

  if (!usuario) {
    const nombre = payload.name?.trim() || email.split('@')[0];
    const created = await registrarUsuario({
      nombre,
      email,
      password: `${randomUUID()}Aa1!`,
      nombreNegocio: nombre,
    });
    usuario = await prisma.usuario.update({
      where: { id: created.id },
      data: { googleId: payload.sub },
    });
  } else if (!usuario.googleId) {
    usuario = await prisma.usuario.update({
      where: { id: usuario.id },
      data: { googleId: payload.sub },
    });
  }

  if (usuario.estado !== EstadoUsuario.ACTIVO) throw new Error('ACCOUNT_INACTIVE');

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
        accion: 'LOGIN_GOOGLE_EXITOSO',
        detalle: 'El usuario inició sesión con Google.',
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
