import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';

export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { passwordActual, nuevaPassword } = req.body;
    
    const usuarioId = (req as any).usuario?.id; 

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

export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const usuarioId = req.usuario!.id;
    const { password } = req.body; 
    const ip = req.ip ?? req.socket.remoteAddress;
    const dispositivo = req.headers['user-agent'];
 
    await userService.eliminarCuenta({ usuarioId, password, ip, dispositivo });
    
    res.status(200).json({ success: true, message: 'Cuenta eliminada exitosamente' });
  } catch (error: any) {
    if (error.message === 'USER_NOT_FOUND') {
      res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      return;
    }
    if (error.message === 'INVALID_PASSWORD') {
      res.status(401).json({ success: false, error: 'Contraseña incorrecta' });
      return;
    }
    next(error);
  }
};