import { z } from 'zod';

const eventoSchema = z.object({
  tipoEvento: z
    .string({ error: 'El tipo de evento es obligatorio' })
    .trim()
    .min(1, {error: 'El tipo de evento no puede estar vacío'})
    .max(50, {error: 'El tipo de evento no puede superar los 50 caracteres'}),

  pantallaActual: z.string().trim().max(200).optional(),

  elemento: z.string().trim().max(100).optional(),

  // JSON libre de metadata — validamos que sea un objeto pero no su estructura interna
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const trackEventsSchema = z.object({
  sessionId: z
    .string({ error: 'El sessionId es obligatorio' })
    .trim()
    .min(1, {error: 'El sessionId no puede estar vacío'})
    .max(200, {error: 'El sessionId no puede superar los 200 caracteres'}),

  eventos: z
    .array(eventoSchema, { error: 'El array de eventos es obligatorio' })
    .min(1, {error: 'Debes enviar al menos un evento'})
    .max(100, {error: 'No se pueden enviar más de 100 eventos por petición'}),
});

export type TrackEventsInput = z.infer<typeof trackEventsSchema>;