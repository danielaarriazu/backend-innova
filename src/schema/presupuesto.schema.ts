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