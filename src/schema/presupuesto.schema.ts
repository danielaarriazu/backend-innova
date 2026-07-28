import { z } from 'zod';

export const cotizarPresupuestoSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'El ID del presupuesto debe ser un número válido'),
  }),
  body: z.object({
    itemsCotizados: z.array(
      z.object({
        nombre: z.string().min(1, 'El nombre del ítem es obligatorio'), 
        cantidad: z.number().positive('La cantidad debe ser mayor a 0'),
        precioUnitario: z.number().min(0, 'El precio unitario no puede ser negativo')
      })
    ).min(1, 'Debes enviar al menos un item para cotizar'),
  }),
});

export const getPresupuestosSchema = z.object({
  origen: z.enum(['emprendedor', 'chatbot', 'EMPRENDEDOR', 'CHATBOT'], { error: 'Origen inválido' })
    .transform(val => val.toUpperCase())
    .optional(),
  estado: z.enum(['PENDIENTE', 'EN_PROCESO',  'ENVIADO', 'CONCRETADO', 'RECHAZADO', 'pendiente', 'en_proceso', 'enviado', 'concretado', 'rechazado'], { error: 'Estado inválido' })
    .transform(val => val.toUpperCase())
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const actualizarEstadoPresupuestoSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'El ID del presupuesto debe ser un número válido'),
  }),
  body: z.object({
    estado: z.enum(['PENDIENTE', 'EN_PROCESO', 'ENVIADO', 'CONCRETADO', 'RECHAZADO', 'pendiente', 'en_proceso', 'enviado', 'concretado', 'rechazado'], { error: 'Estado de presupuesto inválido' })
      .transform(val => val.toUpperCase()),
  }),
});

export const crearPresupuestoPublicoSchema = z.object({
  params: z.object({
    slug: z.string().min(1, 'El slug es requerido'),
    id: z.string().uuid('El ID de la consulta debe ser un UUID válido'),
  }),
  body: z.object({
    items: z.array(
      z.object({
        productoId: z.string().uuid('El productoId debe ser un UUID válido'),
        cantidad: z.number().int().positive('La cantidad debe ser mayor que cero'),
      })
    ).min(1, 'Debes incluir al menos un ítem'),
  }),
});