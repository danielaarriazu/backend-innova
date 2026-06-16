import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';
import { passwordSchema } from '../utils/password.validator'; 

export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { passwordActual, nuevaPassword } = req.body;
    
    const usuarioId = (req as any).usuario?.id; 

    if (!usuarioId) {
      res.status(401).json({ error: 'No autorizado. Falta el contexto de usuario.' });
      return;
    }

    if (!passwordActual || !nuevaPassword) {
      res.status(400).json({ error: 'La contraseña actual y la nueva son obligatorias.' });
      return;
    }

    if (!passwordSchema.validate(nuevaPassword)) {
      res.status(400).json({ 
        error: 'La nueva contraseña no cumple con los requisitos de seguridad',
        detalles: passwordSchema.validate(nuevaPassword, { list: true })
      });
      return;
    }

    const ip = req.ip || req.socket.remoteAddress;
    const dispositivo = req.headers['user-agent'];

    await userService.cambiarPassword({
      usuarioId,
      passwordActual,
      nuevaPassword,
      ip,
      dispositivo
    });

    res.status(200).json({ success: true, message: 'Contraseña actualizada con éxito' });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'USER_NOT_FOUND') {
        res.status(404).json({ error: 'Usuario no encontrado o la cuenta está inactiva' });
        return;
      }
      if (error.message === 'INVALID_CURRENT_PASSWORD') {
        res.status(400).json({ error: 'La contraseña actual es incorrecta' });
        return;
      }
    }
    next(error);
  }
};

export const DeleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const usuarioId = (req as any).usuario?.id;

    if (!usuarioId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    const ip = req.ip || req.socket.remoteAddress;
    const dispositivo = req.headers['user-agent'];

    await userService.eliminarCuenta({ usuarioId, ip, dispositivo });

    res.status(200).json({ success: true, message: 'Cuenta desactivada exitosamente' });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'USER_NOT_FOUND') {
        res.status(404).json({ error: 'Usuario no encontrado o ya eliminado' });
        return;
      }
    }
    next(error);
  }
};