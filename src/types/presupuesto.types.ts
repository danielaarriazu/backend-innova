import { estadoPresupuesto } from '@prisma/client';

export interface PresupuestoItemInput {
  productoId?: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

export interface PresupuestoItem extends PresupuestoItemInput {
  subtotal: number;
}

export interface CrearPresupuestoInput {
  usuarioId?: string;
  slugPublico?: string;
  consultaId: string;
  items: PresupuestoItemInput[];
  diasValidez?: number;
  idempotencyKey?: string;
  estadoInicial?: estadoPresupuesto;
}

export interface CrearPresupuestoPublicoInput {
  slug: string;
  consultaId: string;
  items: Array<Omit<PresupuestoItemInput, 'precioUnitario'> & {
    precioUnitario?: number;
    requiereCotizacion: boolean;
  }>;
  diasValidez?: number;
  idempotencyKey: string;
}

export interface ListarPresupuestosInput {
  page: number;
  limit: number;
  estado?: estadoPresupuesto;
  consultaId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface CotizarPresupuestoInput {
  usuarioId: string;
  presupuestoId: number;
  itemsCotizados: PresupuestoItemInput[];
  diasValidez?: number;
}

export interface CambiarEstadoInput {
  usuarioId: string;
  presupuestoId: number;
  estado: estadoPresupuesto;
}
