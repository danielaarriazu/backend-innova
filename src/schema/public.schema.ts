import { z } from 'zod';

export const getBySlugSchema = z.object({
  params: z.object({
    slug: z.string().min(1, 'El slug es requerido'),
  }),
});

export const initBotSchema = z.object({
  params: z.object({
    slug: z.string().min(1, 'El slug es requerido'),
  }),
  query: z.object({
    sessionId: z.string().optional(),
    hasHistory: z.enum(['true', 'false']).optional(),
  }),
}).superRefine((data, ctx) => {
  if (data.query.hasHistory === 'true' && !data.query.sessionId) {
    ctx.addIssue({
      code: "custom",
      message: "El sessionId es obligatorio para recuperar el historial de chat",
      path: ["query", "sessionId"] 
    });
  }
});