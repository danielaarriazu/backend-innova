import { z } from 'zod';

export const chatSchema = z.object({
  accion: z.string().min(1, 'La acción es requerida').optional(),
  sessionId: z.string().min(1, 'El sessionId es requerido'),
  botId: z.string().min(1, 'El botId es requerido'),
  datosCliente: z.any().optional(),
  contexto: z.string().optional(),
});