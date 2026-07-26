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
  }),
});