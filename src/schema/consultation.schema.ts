import { z } from 'zod';

const optionalText = (max: number) => z.string().trim().min(1).max(max).optional();

export const consultationParamsSchema = z.object({
  id: z.string().uuid('El ID de la consulta debe ser un UUID válido'),
});

export const createConsultationSchema = z.object({
  sessionId: optionalText(200),
  clienteNombre: optionalText(150),
  clienteTelefono: optionalText(50),
  tipoConsulta: optionalText(100),
  prioridad: z.enum(['baja', 'normal', 'alta', 'urgente']).optional(),
  canal: z.enum(['web', 'whatsapp']).default('web'),
  asunto: optionalText(250),
  descripcion: optionalText(2000),
});

export const addConsultationMessageSchema = z.object({
  emisor: z.enum(['CLIENTE', 'EMPRENDEDOR', 'BOT']),
  contenido: z.string().trim().min(1, 'El mensaje no puede estar vacío').max(5000),
  tipoMensaje: z.enum(['TEXTO', 'ACCION', 'PRESUPUESTO']),
});

export const updateConsultationStatusSchema = z.object({
  estado: z.enum(['nueva', 'en_proceso', 'cerrada']),
});

export const updatePublicContactSchema = z.object({
  clienteNombre: z.string().trim().min(1).max(150),
  clienteTelefono: z.string().trim().min(3).max(50),
});