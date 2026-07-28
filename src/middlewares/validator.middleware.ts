import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

type ValidationTarget = 'body' | 'params' | 'query' | 'all';

export const validate =
  (schema: z.ZodTypeAny, target: ValidationTarget = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    const dataToValidate = target === 'all' 
      ? { body: req.body, query: req.query, params: req.params }
      : req[target];

    const result = schema.safeParse(dataToValidate);

    if (!result.success) {
      const errores = formatZodErrors(result.error);
      res.status(400).json({
        success: false,
        error: 'Los datos enviados no son válidos',
        detalles: errores,
      });
      return;
    }

   if (target === 'all') {
      const parsedData = result.data as { body?: any; query?: any; params?: any };
      req.body = parsedData.body || req.body;
      req.query = parsedData.query || req.query;
      req.params = parsedData.params || req.params;
    } else {
      (req as any)[target] = result.data;
    }
    next();
  };


function formatZodErrors(error: ZodError): Array<{ campo: string; mensaje: string }> {
  return error.issues.map((e) => ({
    campo: e.path.join('.') || 'body',
    mensaje: e.message,
  }));
} 