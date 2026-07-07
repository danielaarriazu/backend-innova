import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const resultado = await authService.registrarUsuario(req.body);
 
    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente con configuración de bot inicializada',
      usuarioId: resultado.id,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'EMAIL_ALREADY_REGISTERED') {
      res.status(409).json({ success: false, error: 'El email ya está registrado en el sistema' });
      return;
    }
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ip = req.ip || req.socket.remoteAddress;
    const dispositivo = req.headers['user-agent'];

    const resultado = await authService.iniciarSesion({ ...req.body, ip, dispositivo });

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