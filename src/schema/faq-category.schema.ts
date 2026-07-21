import { z } from 'zod';

const nombreCategoria = z
  .string({ error: 'El nombre de la categoría es obligatorio' })
  .trim()
  .min(1, { error: 'El nombre de la categoría no puede estar vacío' })
  .max(200, { error: 'El nombre no puede superar los 200 caracteres' });

export const createCategorySchema = z.object({
  nombre: nombreCategoria,
});

export const updateCategorySchema = z.object({
  nombre: nombreCategoria,
});

export const categoryParamsSchema = z.object({
  id: z.string({ error: 'El ID es obligatorio' }).uuid('El ID debe ser un UUID válido'),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryParams = z.infer<typeof categoryParamsSchema>;