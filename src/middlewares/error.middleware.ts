import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(`[🔥 SERVER ERROR]: ${err.stack || err.message}`);
  
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor. Por favor, intente más tarde.',
    ...(process.env.NODE_ENV !== 'production' && { details: err.message })
  });
};