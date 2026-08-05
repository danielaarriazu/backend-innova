import { z } from 'zod';
import {
  INVALID_ANSWER_MESSAGE,
  INVALID_QUESTION_MESSAGE,
  pareceRespuestaValida,
  pareceUnaPreguntaReal,
} from '../utils/pareceUnaPreguntaReal';

const uuidField = (label: string) =>
  z.string({ error: `El ${label} es obligatorio` }).uuid(`El ${label} debe ser un UUID válido`);

export const createFaqSchema = z.object({
  categoriaId: uuidField('categoriaId'),

  pregunta: z
    .string({ error: 'La pregunta es obligatoria' })
    .trim()
    .min(5, { error: 'La pregunta debe tener al menos 5 caracteres' })
    .max(500, 'La pregunta no puede superar los 500 caracteres')
    .refine(pareceUnaPreguntaReal, { error: INVALID_QUESTION_MESSAGE }),

  respuesta: z
    .string({ error: 'La respuesta es obligatoria' })
    .trim()
    .min(1, 'La respuesta no puede estar vacía')
    .max(2000, 'La respuesta no puede superar los 2000 caracteres')
    .refine(pareceRespuestaValida, { error: INVALID_ANSWER_MESSAGE }),

});

export const updateFaqSchema = z.object({
  categoriaId: uuidField('categoriaId').optional(),

  pregunta: z
    .string()
    .trim()
    .min(5, 'La pregunta debe tener al menos 5 caracteres')
    .max(500, 'La pregunta no puede superar los 500 caracteres')
    .refine(pareceUnaPreguntaReal, { error: INVALID_QUESTION_MESSAGE })
    .optional(),

  respuesta: z
    .string()
    .trim()
    .min(1, 'La respuesta no puede estar vacía')
    .max(2000, 'La respuesta no puede superar los 2000 caracteres')
    .refine(pareceRespuestaValida, { error: INVALID_ANSWER_MESSAGE })
    .optional(),

}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Debes enviar al menos un campo para actualizar' }
);

export const getFaqsSchema = z.object({
  categoriaId: uuidField('categoriaId').optional(),
  
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

export const createFaqsFromSuggestionsSchema = z.object({
  suggestionIds: z
    .array(z.string().trim().min(1, 'El ID de sugerencia no puede estar vacío'))
    .min(1, 'Seleccioná al menos una pregunta sugerida')
    .max(6, 'No se pueden seleccionar más de seis sugerencias'),
});


export type CreateFaqInput = z.infer<typeof createFaqSchema>;
export type UpdateFaqInput = z.infer<typeof updateFaqSchema>;
export type GetFaqsQuery = z.infer<typeof getFaqsSchema>;
export type DeleteFaqParams = z.infer<typeof deleteFaqSchema>;