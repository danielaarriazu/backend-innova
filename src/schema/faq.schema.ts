import { z } from 'zod';

const uuidField = (label: string) =>
  z.string({ error: `El ${label} es obligatorio` }).uuid(`El ${label} debe ser un UUID válido`);

export const createFaqSchema = z.object({
  categoriaId: uuidField('categoriaId'),

  pregunta: z
    .string({ error: 'La pregunta es obligatoria' })
    .trim()
    .min(5, { error: 'La pregunta debe tener al menos 5 caracteres' })
    .max(500, 'La pregunta no puede superar los 500 caracteres'),

  respuesta: z
    .string({ error: 'La respuesta es obligatoria' })
    .trim()
    .min(1, 'La respuesta no puede estar vacía')
    .max(2000, 'La respuesta no puede superar los 2000 caracteres'),

  activa: z.boolean().default(true),
});

export const updateFaqSchema = z.object({
  categoriaId: uuidField('categoriaId').optional(),

  pregunta: z
    .string()
    .trim()
    .min(5, 'La pregunta debe tener al menos 5 caracteres')
    .max(500, 'La pregunta no puede superar los 500 caracteres')
    .optional(),

  respuesta: z
    .string()
    .trim()
    .min(1, 'La respuesta no puede estar vacía')
    .max(2000, 'La respuesta no puede superar los 2000 caracteres')
    .optional(),

  activa: z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Debes enviar al menos un campo para actualizar' }
);

export const getFaqsSchema = z.object({
  categoriaId: uuidField('categoriaId').optional(),
  
  activa: z.enum(['true', 'false'], { error: 'El valor debe ser "true" o "false"' }).optional(),
  
  buscar: z.string().trim().optional(), // Para un buscador por texto

  page: z.coerce
    .number({ error: 'La página debe ser un número' })
    .int()
    .min(1)
    .default(1),
    
  limit: z.coerce
    .number({ error: 'El límite debe ser un número' })
    .int()
    .min(1)
    .max(100) // Evitamos que pidan 1 millón de registros de golpe
    .default(10),
});

export const deleteFaqSchema = z.object({
  id: uuidField('ID de la FAQ'),
});


export type CreateFaqInput = z.infer<typeof createFaqSchema>;
export type UpdateFaqInput = z.infer<typeof updateFaqSchema>;
export type GetFaqsQuery = z.infer<typeof getFaqsSchema>;
export type DeleteFaqParams = z.infer<typeof deleteFaqSchema>;