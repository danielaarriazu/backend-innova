import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Estructura del contenido que guardamos adentro del JWT al hacer login
interface TokenPayload {
  id: string;
  rol: string;
}

export const verificarToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Buscamos el encabezado 'Authorization' (Suele venir como: "Bearer el_token_aca")
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Acceso denegado. No se proporcionó un token válido.' });
      return;
    }

    // Cortamos el string para quedarnos con el token puro
    const token = authHeader.split(' ')[1];

    // Verificamos la firma criptográfica usando la clave secreta 
    const secreto = process.env.JWT_SECRET || 'secret_provisorio';
    const decoded = jwt.verify(token, secreto) as TokenPayload;

    // Inyectamos los datos decodificados en el objeto de la petición (req)
    // De esta forma, el user.controller puede hacer: (req as any).usuario.id
    (req as any).usuario = {
      id: decoded.id,
      rol: decoded.rol
    };

    next();
  } catch (error) {
    res.status(403).json({ message: 'Token inválido o expirado.' });
  }
};