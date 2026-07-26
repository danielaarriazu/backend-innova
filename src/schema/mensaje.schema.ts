import { z } from 'zod';

export const getHistorialSchema = z.object({
    params: z.object({
    slug: z.string().min(1, 'El slug del bot es obligatorio'),
    sessionId: z.string().min(1, 'El sessionId es obligatorio'),
  }),
});