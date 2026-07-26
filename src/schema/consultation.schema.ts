import { z } from 'zod';

const optionalText = (max: number) => z.string().trim().min(1).max(max).optional();

export const consultationParamsSchema = z.object({
  id: z.string().uuid('El ID de la consulta debe ser un UUID válido'),
});

export const createConsultationSchema = z.object({
  sessionId: optionalText(200),
  sessionAnonimaId: optionalText(200),
  tipoConsulta: optionalText(100),
  canal: z.enum(['web', 'whatsapp']).default('web'),
  asunto: optionalText(250),
  descripcion: optionalText(2000),
}).transform(({ sessionAnonimaId, ...data }) => ({
  ...data,
  sessionId: data.sessionId ?? sessionAnonimaId,
}));

export const addConsultationMessageSchema = z.object({
  emisor: z.enum(['CLIENTE', 'EMPRENDEDOR', 'BOT', 'cliente', 'usuario', 'emprendedor', 'bot'])
    .transform((value) => {
      if (value === 'cliente') return 'CLIENTE' as const;
      if (value === 'usuario' || value === 'emprendedor') return 'EMPRENDEDOR' as const;
      if (value === 'bot') return 'BOT' as const;
      return value;
    }),
  contenido: z.string().trim().min(1, 'El mensaje no puede estar vacío').max(5000),
  tipoMensaje: z.enum(['TEXTO', 'ACCION', 'PRESUPUESTO', 'texto', 'accion', 'presupuesto'])
    .transform((value) => value.toUpperCase() as 'TEXTO' | 'ACCION' | 'PRESUPUESTO'),
});

export const updateConsultationStatusSchema = z.object({
  estado: z.enum([
    'nueva', 'en_proceso', 'resuelta', 'cerrada',
    'NUEVA', 'EN_PROCESO', 'RESUELTA', 'CERRADA'
  ]).transform((val) => val.toLowerCase()), 
});

export const updatePublicContactSchema = z.object({
  clienteNombre: z.string().trim().min(1).max(150),
  clienteTelefono: z.string().trim().min(3).max(50),
});
