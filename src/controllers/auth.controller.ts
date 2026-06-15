import { Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db';
import { registrarActividad } from '../services/activity.service';
import { passwordSchema } from '../utils/password.validator';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_ultra_secreta';

// REGISTRO CON CREACIÓN AUTOMÁTICA DE BOT
export const register = async (req: Request, res: Response) => {
  try {
    const { nombre, email, password } = req.body;
   
    //Validamos que el nombre no esté vacío o compuesto solo por espacios
    if (!nombre || nombre.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre es obligatorio y no puede estar vacío' });
    }

    // Validamos formato basico de email "ejemplo@dominio.com"
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ error: 'El formato del correo electrónico no es válido' });
    }

    // Validamos contraseña segura: usando  una funcion de validación externa (password-validator) con reglas especificas en utils/password.validator.ts
    if (!password || !passwordSchema.validate(password)) {
      return res.status(400).json({ 
        error: 'La contraseña debe tener al menos 8 caracteres, e incluir letras, números y al menos un carácter especial (ej: @, $, !, %, *, ?, &, ., -, _, #)' 
      });
    }
    
    const usuarioExistente = await prisma.usuario.findUnique({ where: { email } });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // Usamos transacción para que no se cree un usuario sin su bot
    const nuevoUsuario = await prisma.$transaction(async (tx) => {
      const user = await tx.usuario.create({
        data: {
          nombre,
          email,
          password: hashedPassword,
          rol: 'EMPRENDEDOR',
          estado: 'ACTIVO'
        }
      });

      await tx.configuracionBot.create({
        data: {
          usuario_id: user.id,
          activo: false // Arranca apagado hasta que lo configuremos
        }
      });

      return user;
    });

    return res.status(201).json({
      success: true,
      message: 'Emprendedor registrado con éxito junto a su bot',
      usuarioId: nuevoUsuario.id
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno en el proceso de registro' });
  }
};

// LOGIN CON TOKEN DE 24 HORAS Y ACTUALIZACIÓN DE ÚLTIMA SESIÓN
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const passwordValido = await bcryptjs.compare(password, usuario.password);
    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Guardamos la actualización de última sesión solo al ingresar credenciales
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultima_sesion: new Date() }
    });

    // Registramos la actividad de login exitoso
    await registrarActividad(
      usuario.id,
      'LOGIN_EXITOSO',
      'El usuario inició sesión exitosamente.',
      req
    );
    
    // Seteamos estrictamente la duración del token a 24 horas
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '24h' } // podemos seterar las horas a las que sean necesarias.
    );

    return res.status(200).json({
      success: true,
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno en el proceso de login' });
  }
};