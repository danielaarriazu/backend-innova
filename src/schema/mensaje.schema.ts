import { z } from 'zod';

export const getHistorialSchema = z.object({
  params: z.object({
    slug: z.string({ error: "El slug es requerido" }),
    sessionId: z.string({ error: "El sessionId es requerido" })
  })
});