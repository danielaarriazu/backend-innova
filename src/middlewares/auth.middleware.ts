import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { EstadoUsuario } from '@prisma/client';
import 'multer';

export interface TokenPayload {
  id: string;
  email: string;
  rol: string;
}

declare global {
  namespace Express {
    interface Request {
      usuario?: TokenPayload;
      file?: Express.Multer.File;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET no está configurado en el archivo .env');
  process.exit(1); 
}

export const verificarToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token válido.' });
      return;
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      select: { estado: true },
    });
 
    if (!usuario || usuario.estado !== EstadoUsuario.ACTIVO) {
      res.status(401).json({ error: 'Sesión inválida. La cuenta fue eliminada o desactivada.' });
      return;
    }

    req.usuario = {
      id: decoded.id,
      email: decoded.email,
      rol: decoded.rol
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado. Por favor, inicie sesión nuevamente.' });
  }
};

export const verificarTokenOpcional = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      select: { estado: true },
    });

    if (usuario && usuario.estado === EstadoUsuario.ACTIVO){
    req.usuario = {
      id: decoded.id,
      email: decoded.email,
      rol: decoded.rol
    };
  }

    next();
  } catch (error) {
    next();
  }
};
