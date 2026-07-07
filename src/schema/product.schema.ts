import { z } from 'zod';

const precioField = z
  .number({ error: 'El precio es obligatorio'})
  .positive({ error: 'El precio debe ser mayor a 0' })
  .multipleOf(0.01, { error: 'El precio no puede tener más de 2 decimales' });

const stockField = z
  .number({ error: 'El stock debe ser un número' })
  .int({ error: 'El stock debe ser un número entero' })
  .min(0, { error: 'El stock no puede ser negativo' })
  .default(0);

  const uuidField = (label: string) =>
  z.uuid({
    error: (issue) =>
      issue.input === undefined
        ? `El ${label} es obligatorio`
        : `El ${label} debe ser un UUID válido`
  });

export const createProductSchema = z.object({
  nombre: z
    .string({ error: 'El nombre del producto es obligatorio' })
    .trim()
    .min(1, { error: 'El nombre no puede estar vacío' })
    .max(200, { error: 'El nombre no puede superar los 200 caracteres' }),

  descripcion: z
    .string({ error: 'La descripción es obligatoria' })
    .trim()
    .max(2000, { error: 'La descripción no puede superar los 2000 caracteres' })
    .optional(),

  precio: precioField,

  stock: stockField,

  urlImagen: z
    .url({ error: 'La URL de la imagen no es válida' })
    .optional()
    .or(z.literal('')),

  activo: z.boolean().default(true),
});

export const updateProductSchema = z.object({
  nombre: z
    .string({ error: 'El nombre es obligatorio' })
    .trim()
    .min(1, { error: 'El nombre no puede estar vacío' })
    .max(200, { error: 'El nombre no puede superar los 200 caracteres' })
    .optional(),

  descripcion: z
    .string({ error: 'La descripción es obligatoria' })
    .trim()
    .max(2000, { error: 'La descripción no puede superar los 2000 caracteres' })
    .optional()
    .nullable(), // permite poner null para borrar la descripción

  precio: precioField.optional(),

  stock: stockField.optional(),

  urlImagen: z
    .url({ error: 'La URL de la imagen no es válida' })
    .optional()
    .nullable()
    .or(z.literal('')),

  activo: z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { error: 'Debes enviar al menos un campo para actualizar' }
);

export const getProductsSchema = z.object({
  page: z.coerce
    .number({ error: 'La página debe ser un número' })
    .int()
    .min(1)
    .default(1),
    
  limit: z.coerce
    .number({ error: 'El límite debe ser un número' })
    .int()
    .min(1)
    .max(100)
    .default(10),

  buscar: z.string().trim().optional(),
  activo: z.enum(['true', 'false'], { error: 'El valor debe ser "true" o "false"' }).optional(),
});

export const deleteProductSchema = z.object({
  id: uuidField('ID del producto'),
});



export type CreateProductInput = z.infer<typeof createProductSchema>;
export type GetProductsQuery = z.infer<typeof getProductsSchema>;
export type DeleteProductParams = z.infer<typeof deleteProductSchema>;
export type UpdateProductParams = z.infer<typeof updateProductSchema>;
