import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

type ValidationTarget = 'body' | 'params' | 'query';

export const validate =
  (schema: z.ZodTypeAny, target: ValidationTarget = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errores = formatZodErrors(result.error);
      res.status(400).json({
        success: false,
        error: 'Los datos enviados no son válidos',
        detalles: errores,
      });
      return;
    }

    (req as any)[target] = result.data;
    next();
  };


function formatZodErrors(error: ZodError): Array<{ campo: string; mensaje: string }> {
  return error.issues.map((e) => ({
    campo: e.path.join('.') || 'body',
    mensaje: e.message,
  }));
}