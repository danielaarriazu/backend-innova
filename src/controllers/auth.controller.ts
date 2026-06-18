import { Request, Response, NextFunction } from 'express';
import { passwordSchema } from '../utils/password.validator'; 
import * as authService from '../services/auth.service';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { nombre, email, password, nombreNegocio } = req.body;
   
    if (!nombre || nombre.trim().length === 0) {
      res.status(400).json({ error: 'El nombre es obligatorio y no puede estar vacío' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
    if (!email || !emailRegex.test(email)) {
      res.status(400).json({ error: 'El formato del correo electrónico no es válido' });
      return;
    }

    if (!password || !passwordSchema.validate(password)) {
      res.status(400).json({ 
        error: 'La contraseña no cumple con los requisitos de seguridad', 
        detalles: passwordSchema.validate(password, { list: true }) 
      });
      return;
    }

    const resultado = await authService.registrarUsuario({ nombre, email, password, nombreNegocio });
    
    res.status(201).json({ 
      success: true, 
      message: 'Usuario registrado exitosamente con configuración de bot inicializada', 
      usuarioId: resultado.id 
    });

  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'EMAIL_ALREADY_REGISTERED') {
      res.status(409).json({ error: 'El email ya está registrado en el sistema' });
      return;
    }
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'El email y la contraseña son requeridos' });
      return;
    }

    const ip = req.ip || req.socket.remoteAddress;
    const dispositivo = req.headers['user-agent'];

    const resultado = await authService.iniciarSesion({ email, password, ip, dispositivo });

    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      token: resultado.token,
      usuario: resultado.usuario
    });

  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'INVALID_CREDENTIALS') {
        res.status(401).json({ error: 'Credenciales inválidas' });
        return;
      }
      if (error.message === 'ACCOUNT_INACTIVE') {
        res.status(403).json({ error: 'Esta cuenta se encuentra suspendida o eliminada' });
        return;
      }
    }
    next(error);
  }
};