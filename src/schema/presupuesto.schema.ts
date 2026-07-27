import { z } from 'zod';

const uuid = (mensaje: string) => z.string().uuid({ message: mensaje });

const itemSchema = z.object({
  productoId: uuid('El productoId debe ser un UUID válido').optional(),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(200),
  cantidad: z.number().int().positive('La cantidad debe ser mayor que cero'),
  precioUnitario: z.number().nonnegative('El precio unitario no puede ser negativo'),
}).strict();

export const presupuestoIdParamsSchema = z.object({
  id: z.coerce.number().int().positive('El ID debe ser un número entero positivo'),
});

export const crearPresupuestoSchema = z.object({
  consultaId: uuid('La consulta debe ser un UUID válido'),
  items: z.array(itemSchema).min(1, 'Debe incluir al menos un ítem'),
  diasValidez: z.number().int().min(1).max(365).default(7),
  idempotencyKey: z.string().trim().min(8).max(200),
}).strict();

export const listarPresupuestosSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  estado: z.enum(['PENDIENTE', 'EN_PROCESO', 'ENVIADO', 'CONCRETADO', 'RECHAZADO']).optional(),
  consultaId: uuid('La consulta debe ser un UUID válido').optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine(
  (data) => !data.startDate || !data.endDate || data.startDate <= data.endDate,
  { message: 'La fecha inicial no puede ser posterior a la fecha final', path: ['endDate'] },
);

export const cambiarEstadoSchema = z.object({
  estado: z.enum(['PENDIENTE', 'EN_PROCESO', 'ENVIADO', 'CONCRETADO', 'RECHAZADO']),
}).strict();

export const cotizarPresupuestoSchema = z.object({
  itemsCotizados: z.array(itemSchema).min(1, 'Debe incluir al menos un ítem cotizado'),
  diasValidez: z.number().int().min(1).max(365).optional(),
}).strict();

export type CrearPresupuestoBody = z.infer<typeof crearPresupuestoSchema>;
export type ListarPresupuestosQuery = z.infer<typeof listarPresupuestosSchema>;
export type CambiarEstadoBody = z.infer<typeof cambiarEstadoSchema>;
export type CotizarPresupuestoBody = z.infer<typeof cotizarPresupuestoSchema>;
