import { Request, Response, NextFunction } from 'express';
import { esConflictoSlug } from '../utils/slug';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (esConflictoSlug(err)) {
    res.status(409).json({
      success: false,
      code: 'SLUG_ALREADY_EXISTS',
      field: 'slug',
      error: 'Ese enlace público ya está siendo utilizado.',
    });
    return;
  }

  console.error(`[🔥 SERVER ERROR]: ${err.stack || err.message}`);

  res.status(500).json({
    success: false,
    error: 'Error interno del servidor. Por favor, intente más tarde.',
    ...(process.env.NODE_ENV !== 'production' && { details: err.message })
  });
};
