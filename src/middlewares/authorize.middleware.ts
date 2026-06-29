import { Request, Response, NextFunction } from 'express';
import { Rol } from '@prisma/client';
 
export const authorize = (...roles: Rol[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    
    if (!req.usuario) {
      res.status(401).json({ error: 'No autenticado.' });
      return;
    }
 
    if (!roles.includes(req.usuario.rol as Rol)) {
      res.status(403).json({ error: 'No tenés permisos para realizar esta acción.' });
      return;
    }
 
    next();
  };
 