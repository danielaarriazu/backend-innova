import { Prisma, estadoPresupuesto } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import prisma from '../lib/prisma';
import { DatosNegocio, ItemPresupuesto } from '../types/pdf.types';
import { generarPresupuestoFormal } from './pdf.service';
import {
  CambiarEstadoInput,
  CotizarPresupuestoInput,
  CrearPresupuestoInput,
  ListarPresupuestosInput,
  PresupuestoItem,
  PresupuestoItemInput,
} from '../types/presupuesto.types';

export type PresupuestoErrorCode =
  | 'CONSULTATION_NOT_FOUND'
  | 'PRODUCT_NOT_FOUND'
  | 'BUDGET_NOT_FOUND'
  | 'INVALID_STATE_TRANSITION'
  | 'IDEMPOTENCY_CONFLICT';

export class PresupuestoError extends Error {
  constructor(public readonly code: PresupuestoErrorCode) {
    super(code);
    this.name = 'PresupuestoError';
  }
}

const detalleInclude = {
  consulta: {
    include: {
      lead: true,
      bot: {
        select: {
          id: true,
          nombreNegocio: true,
          telefono: true,
          horarioAtencion: true,
          logoUrl: true,
        },
      },
    },
  },
} satisfies Prisma.PresupuestoInclude;

const transicionesPermitidas: Record<estadoPresupuesto, estadoPresupuesto[]> = {
  PENDIENTE: ['EN_PROCESO', 'RECHAZADO'],
  EN_PROCESO: ['ENVIADO', 'RECHAZADO'],
  ENVIADO: ['CONCRETADO', 'RECHAZADO'],
  CONCRETADO: [],
  RECHAZADO: [],
};

const calcularItems = (items: PresupuestoItemInput[]): PresupuestoItem[] =>
  items.map((item) => ({
    ...(item.productoId ? { productoId: item.productoId } : {}),
    nombre: item.nombre.trim(),
    cantidad: item.cantidad,
    precioUnitario: item.precioUnitario,
    subtotal: item.cantidad * item.precioUnitario,
  }));

const calcularTotal = (items: PresupuestoItem[]): number =>
  items.reduce((total, item) => total + item.subtotal, 0);

const calcularVencimiento = (diasValidez: number, desde = new Date()): Date => {
  const fecha = new Date(desde);
  fecha.setDate(fecha.getDate() + diasValidez);
  return fecha;
};

const normalizarDetalle = (detalle: unknown): PresupuestoItem[] => {
  if (!Array.isArray(detalle)) return [];
  return detalle.map((item: any) => ({
    ...(item.productoId ? { productoId: String(item.productoId) } : {}),
    nombre: String(item.nombre ?? ''),
    cantidad: Number(item.cantidad ?? 0),
    precioUnitario: Number(item.precioUnitario ?? 0),
    subtotal: Number(
      item.subtotal ?? Number(item.cantidad ?? 0) * Number(item.precioUnitario ?? 0),
    ),
  }));
};

const serializarPresupuesto = (presupuesto: any) => ({
  id: presupuesto.id,
  estado: presupuesto.estado,
  consultaId: presupuesto.consultaId,
  consulta: presupuesto.consulta
    ? {
        id: presupuesto.consulta.id,
        asunto: presupuesto.consulta.asunto,
        estado: presupuesto.consulta.estado,
        cliente: presupuesto.consulta.lead
          ? {
              nombre: presupuesto.consulta.lead.nombre,
              telefono: presupuesto.consulta.lead.telefono,
            }
          : null,
      }
    : undefined,
  items: normalizarDetalle(presupuesto.detalle),
  total: Number(presupuesto.total),
  fechaEmision: presupuesto.fechaEmision,
  fechaVencimiento: presupuesto.fechaVencimiento,
  diasValidez: presupuesto.validezDias,
  linkPdf: presupuesto.linkPdf,
  fechaCreacion: presupuesto.fechaCreacion,
  fechaActualizacion: presupuesto.fechaActualizacion,
});

async function validarProductosDelNegocio(
  botId: string,
  items: PresupuestoItemInput[],
): Promise<void> {
  const productoIds = [...new Set(items.flatMap((item) => item.productoId ? [item.productoId] : []))];
  if (productoIds.length === 0) return;

  const cantidad = await prisma.producto.count({
    where: { id: { in: productoIds }, botId },
  });

  if (cantidad !== productoIds.length) {
    throw new PresupuestoError('PRODUCT_NOT_FOUND');
  }
}

async function obtenerConsultaPropia(consultaId: string, usuarioId?: string) {
  const consulta = await prisma.consulta.findFirst({
    where: {
      id: consultaId,
      ...(usuarioId ? { bot: { usuarioId } } : {}),
    },
    select: { id: true, botId: true },
  });

  if (!consulta) throw new PresupuestoError('CONSULTATION_NOT_FOUND');
  return consulta;
}

async function buscarPorClaveIdempotencia(clave: string, usuarioId?: string) {
  const presupuesto = await prisma.presupuesto.findUnique({
    where: { idempotencyKey: clave },
    include: detalleInclude,
  });

  if (!presupuesto) return null;
  if (usuarioId) {
    const propio = await prisma.presupuesto.count({
      where: { id: presupuesto.id, consulta: { bot: { usuarioId } } },
    });
    if (!propio) throw new PresupuestoError('IDEMPOTENCY_CONFLICT');
  }
  return presupuesto;
}

export async function crearPresupuesto(input: CrearPresupuestoInput) {
  const consulta = await obtenerConsultaPropia(input.consultaId, input.usuarioId);
  await validarProductosDelNegocio(consulta.botId, input.items);

  const clave = input.idempotencyKey
    ? `${input.usuarioId ?? 'public'}:${input.idempotencyKey}`
    : undefined;

  if (clave) {
    const existente = await buscarPorClaveIdempotencia(clave, input.usuarioId);
    if (existente) return { presupuesto: serializarPresupuesto(existente), creado: false };
  }

  const items = calcularItems(input.items);
  const total = calcularTotal(items);
  const diasValidez = input.diasValidez ?? 7;
  const fechaEmision = new Date();

  try {
    const presupuesto = await prisma.presupuesto.create({
      data: {
        consultaId: consulta.id,
        estado: input.estadoInicial ?? 'PENDIENTE',
        detalle: items as unknown as Prisma.InputJsonArray,
        total: new Prisma.Decimal(total),
        idempotencyKey: clave,
        fechaEmision,
        validezDias: diasValidez,
        fechaVencimiento: calcularVencimiento(diasValidez, fechaEmision),
      },
      include: detalleInclude,
    });

    return { presupuesto: serializarPresupuesto(presupuesto), creado: true };
  } catch (error) {
    if (clave && error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const existente = await buscarPorClaveIdempotencia(clave, input.usuarioId);
      if (existente) return { presupuesto: serializarPresupuesto(existente), creado: false };
    }
    throw error;
  }
}

export async function listarPresupuestos(usuarioId: string, filtros: ListarPresupuestosInput) {
  const where: Prisma.PresupuestoWhereInput = {
    consulta: { bot: { usuarioId } },
    ...(filtros.estado ? { estado: filtros.estado } : {}),
    ...(filtros.consultaId ? { consultaId: filtros.consultaId } : {}),
    ...(filtros.startDate || filtros.endDate
      ? {
          fechaEmision: {
            ...(filtros.startDate ? { gte: filtros.startDate } : {}),
            ...(filtros.endDate ? { lte: filtros.endDate } : {}),
          },
        }
      : {}),
  };

  const [presupuestos, total] = await prisma.$transaction([
    prisma.presupuesto.findMany({
      where,
      include: detalleInclude,
      orderBy: { fechaCreacion: 'desc' },
      skip: (filtros.page - 1) * filtros.limit,
      take: filtros.limit,
    }),
    prisma.presupuesto.count({ where }),
  ]);

  return {
    presupuestos: presupuestos.map(serializarPresupuesto),
    paginacion: {
      page: filtros.page,
      limit: filtros.limit,
      total,
      totalPages: Math.ceil(total / filtros.limit),
    },
  };
}

export async function obtenerPresupuesto(usuarioId: string, presupuestoId: number) {
  const presupuesto = await prisma.presupuesto.findFirst({
    where: { id: presupuestoId, consulta: { bot: { usuarioId } } },
    include: detalleInclude,
  });

  if (!presupuesto) throw new PresupuestoError('BUDGET_NOT_FOUND');
  return serializarPresupuesto(presupuesto);
}

export async function cambiarEstadoPresupuesto(input: CambiarEstadoInput) {
  const actual = await prisma.presupuesto.findFirst({
    where: { id: input.presupuestoId, consulta: { bot: { usuarioId: input.usuarioId } } },
    select: { id: true, estado: true },
  });

  if (!actual) throw new PresupuestoError('BUDGET_NOT_FOUND');
  if (actual.estado !== input.estado && !transicionesPermitidas[actual.estado].includes(input.estado)) {
    throw new PresupuestoError('INVALID_STATE_TRANSITION');
  }

  const actualizado = await prisma.presupuesto.update({
    where: { id: actual.id },
    data: { estado: input.estado },
    include: detalleInclude,
  });
  return serializarPresupuesto(actualizado);
}

export async function generarPdfDesdeBaseDeDatos(
  presupuestoId: number,
  usuarioId?: string,
): Promise<string> {
  const presupuesto = await prisma.presupuesto.findFirst({
    where: {
      id: presupuestoId,
      ...(usuarioId ? { consulta: { bot: { usuarioId } } } : {}),
    },
    include: detalleInclude,
  });

  if (!presupuesto) throw new PresupuestoError('BUDGET_NOT_FOUND');

  const lead = presupuesto.consulta.lead;
  const clienteNombre = lead?.nombre || lead?.telefono || 'Cliente sin registrar';
  const referencia = `Solicitud de presupuesto (Ref: C-${presupuesto.consulta.id.substring(0, 6)})`;
  const configNegocio = presupuesto.consulta.bot;
  const datosNegocio: DatosNegocio = {
    nombre: configNegocio.nombreNegocio || 'Negocio sin nombre',
    telefono: configNegocio.telefono || '',
    horario: configNegocio.horarioAtencion || 'Horario a coordinar',
  };

  return generarPresupuestoFormal(
    presupuesto.id,
    clienteNombre,
    referencia,
    presupuesto.detalle as unknown as ItemPresupuesto[],
    datosNegocio,
    presupuesto.validezDias,
  );
}

async function subirPdf(rutaPdf: string): Promise<string> {
  const nombreParaNube = path.basename(rutaPdf, '.pdf');
  try {
    const uploadResult = await cloudinary.uploader.upload(rutaPdf, {
      folder: 'presupuestos_clientes',
      resource_type: 'raw',
      public_id: nombreParaNube,
      format: 'pdf',
    });
    return uploadResult.secure_url;
  } finally {
    try {
      if (fs.existsSync(rutaPdf)) fs.unlinkSync(rutaPdf);
    } catch (error) {
      console.warn('[WARNING] No se pudo borrar el PDF temporal:', error);
    }
  }
}

export async function crearYEnviarPresupuesto(
  consultaId: string,
  items: ItemPresupuesto[],
): Promise<string> {
  const resultado = await crearPresupuesto({
    consultaId,
    items,
    diasValidez: 10,
    idempotencyKey: `chat:${consultaId}`,
    estadoInicial: 'ENVIADO',
  });

  if (resultado.presupuesto.linkPdf) return resultado.presupuesto.linkPdf;
  const rutaPdf = await generarPdfDesdeBaseDeDatos(resultado.presupuesto.id);
  const linkPdf = await subirPdf(rutaPdf);
  await prisma.presupuesto.update({
    where: { id: resultado.presupuesto.id },
    data: { linkPdf },
  });
  return linkPdf;
}

export async function cotizarYActualizarPresupuesto(input: CotizarPresupuestoInput) {
  const actual = await prisma.presupuesto.findFirst({
    where: { id: input.presupuestoId, consulta: { bot: { usuarioId: input.usuarioId } } },
    select: { id: true, estado: true, consulta: { select: { botId: true } } },
  });
  if (!actual) throw new PresupuestoError('BUDGET_NOT_FOUND');
  if (!['PENDIENTE', 'EN_PROCESO', 'ENVIADO'].includes(actual.estado)) {
    throw new PresupuestoError('INVALID_STATE_TRANSITION');
  }
  await validarProductosDelNegocio(actual.consulta.botId, input.itemsCotizados);

  const items = calcularItems(input.itemsCotizados);
  const diasValidez = input.diasValidez ?? 10;
  const fechaEmision = new Date();
  await prisma.presupuesto.update({
    where: { id: actual.id },
    data: {
      detalle: items as unknown as Prisma.InputJsonArray,
      total: new Prisma.Decimal(calcularTotal(items)),
      fechaEmision,
      validezDias: diasValidez,
      fechaVencimiento: calcularVencimiento(diasValidez, fechaEmision),
    },
  });

  const rutaPdf = await generarPdfDesdeBaseDeDatos(actual.id, input.usuarioId);
  const linkPdf = await subirPdf(rutaPdf);
  await prisma.presupuesto.update({
    where: { id: actual.id },
    data: { linkPdf, estado: 'ENVIADO' },
  });
  return obtenerPresupuesto(input.usuarioId, actual.id);
}
