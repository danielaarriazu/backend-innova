import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { generarPresupuestoFormal } from './pdf.service';
import { ItemPresupuesto, DatosNegocio } from '../types/pdf.types';
import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';
import path from 'path';

const diasValidez = 10;
const fechaVencimiento = new Date();
fechaVencimiento.setDate(fechaVencimiento.getDate() + diasValidez);

export async function generarPdfDesdeBaseDeDatos(presupuestoId: number): Promise<string> {
  const presupuesto = await prisma.presupuesto.findUnique({
    where: { id: presupuestoId },
    include: {
      consulta: {
        include: {
          lead: true, 
          bot: true   
        }
      }
    }
  });

  if (!presupuesto) {
    throw new Error(`No se encontró el presupuesto con ID: ${presupuestoId}`);
  }

  const lead = presupuesto.consulta.lead;
  let clienteNombre = 'Cliente sin registrar';

  if (lead) {
    clienteNombre = lead.nombre || lead.telefono;
  }
  const referencia = `Solicitud de presupuesto (Ref: C-${presupuesto.consulta.id.substring(0, 6)})`;

  const configNegocio = presupuesto.consulta.bot; 
  const datosDelNegocioDinamicos: DatosNegocio = {
    nombre: configNegocio.nombreNegocio || 'Negocio sin nombre', 
    telefono: configNegocio.telefono || '',
    horario: configNegocio.horarioAtencion || 'Horario a coordinar',
  };

  const items = presupuesto.detalle as unknown as ItemPresupuesto[];

  try {
    const rutaDelPdf = await generarPresupuestoFormal(
      presupuesto.id,
      clienteNombre,
      referencia,
      items,
      datosDelNegocioDinamicos,
      presupuesto.validezDias
    );
    return rutaDelPdf;
  } catch (error) {
    console.error('Error al generar el documento PDF:', error);
    throw error;
  }
}

async function gestionarSubidaNube(presupuestoId: number, rutaPdf: string, resourceType: 'auto' | 'raw'): Promise<string> {
  const nombreParaNube = path.basename(rutaPdf, '.pdf');
  let urlCloudinary = '';

  try {
    const uploadResult = await cloudinary.uploader.upload(rutaPdf, {
      folder: 'presupuestos_clientes',
      resource_type: resourceType, 
      public_id: nombreParaNube,
      format: 'pdf'
    });
    
    urlCloudinary = uploadResult.secure_url;
  } catch (error) {
    console.error('[ERROR] Falló la subida a Cloudinary:', error);
    throw new Error('Se generó el PDF pero no se pudo subir a la nube.');
  } finally {
    try {
      if (fs.existsSync(rutaPdf)) {
        fs.unlinkSync(rutaPdf);
      }
    } catch (error) {
      console.warn('[WARNING] No se pudo borrar el PDF temporal:', error);
    }
  }

  if (urlCloudinary) {
    try {
      await prisma.presupuesto.update({
        where: { id: presupuestoId },
        data: { linkPdf: urlCloudinary }
      });
    } catch (error) {
      console.error('[ERROR] Se subió el PDF pero falló al guardar la URL en la BD:', error);
    }
  }

  return urlCloudinary;
}
  
export async function crearYEnviarPresupuesto(consultaId: string, items: ItemPresupuesto[]) {
  
  const requiereCotizacion = items.some(item => !item.precioUnitario || item.precioUnitario === 0);

  const estadoInicial = requiereCotizacion ? 'PENDIENTE' : 'ENVIADO';
  
  const nuevoPresupuesto = await prisma.presupuesto.create({
    data: {
      consultaId: consultaId, 
      estado: estadoInicial, 
      detalle: items as unknown as Prisma.InputJsonArray,
      validezDias: diasValidez,
      fechaVencimiento: fechaVencimiento,
      origen: 'CHATBOT'
    }
  });

  const rutaPdf = await generarPdfDesdeBaseDeDatos(nuevoPresupuesto.id);

  return await gestionarSubidaNube(nuevoPresupuesto.id, rutaPdf, 'auto');
}

export async function cotizarYActualizarPresupuesto(
  presupuestoId: number, 
  itemsCotizados: ItemPresupuesto[]
): Promise<string> {
  await prisma.presupuesto.update({
    where: { id: presupuestoId },
    data: {
      detalle: itemsCotizados as unknown as Prisma.InputJsonArray,
      estado: 'ENVIADO',
      validezDias: diasValidez,
      fechaVencimiento: fechaVencimiento,
      origen: 'EMPRENDEDOR'
    }
  });

  const rutaPdfGenerado = await generarPdfDesdeBaseDeDatos(presupuestoId);

  return await gestionarSubidaNube(presupuestoId, rutaPdfGenerado, 'auto');
}

export async function obtenerPresupuestosFiltrados(
  usuarioId: string, 
  filtros: { origen?: 'EMPRENDEDOR' | 'CHATBOT'; estado?: string; page: number; limit: number }
) {
  const bot = await prisma.configuracionBot.findUnique({ where: { usuarioId } });
  if (!bot) throw new Error('BOT_NOT_FOUND');

  const { origen, estado, page, limit } = filtros;

  const whereClause: any = {
    consulta: {
      botId: bot.id,
    },
  };

  if (estado) {
    whereClause.estado = estado.toUpperCase();
  }

  if (origen) {
    whereClause.origen = origen.toUpperCase();
  }

  const skip = (page - 1) * limit;

  const [presupuestos, total] = await prisma.$transaction([
    prisma.presupuesto.findMany({
      where: whereClause,
      include: {
        consulta: {
          include: { lead: true },
        },
      },
      orderBy: { fechaCreacion: 'desc' },
      skip,
      take: limit,
    }),
    prisma.presupuesto.count({ where: whereClause }),
  ]);

  return {
    presupuestos,
    total,
    page,
    limit,
    totalPaginas: Math.ceil(total / limit),
  };
}

export async function actualizarEstadoPresupuesto(
  usuarioId: string, 
  presupuestoId: number, 
  nuevoEstado: 'PENDIENTE' | 'EN_PROCESO' | 'ENVIADO' | 'CONCRETADO' | 'RECHAZADO'
) {
  const bot = await prisma.configuracionBot.findUnique({ where: { usuarioId } });
  if (!bot) throw new Error('BOT_NOT_FOUND');

  // Verificamos que el presupuesto pertenezca a una consulta del bot del usuario
  const presupuestoExistente = await prisma.presupuesto.findFirst({
    where: {
      id: presupuestoId,
      consulta: {
        botId: bot.id,
      },
    },
  });

  if (!presupuestoExistente) {
    throw new Error('PRESUPUESTO_NOT_FOUND');
  }

  const presupuestoActualizado = await prisma.presupuesto.update({
    where: { id: presupuestoId },
    data: {
      estado: nuevoEstado,
    },
    include: {
      consulta: {
        include: { lead: true },
      },
    },
  });

  return presupuestoActualizado;
}

export async function obtenerPresupuestoPorId(usuarioId: string, presupuestoId: number) {
  const bot = await prisma.configuracionBot.findUnique({ where: { usuarioId } });
  if (!bot) throw new Error('BOT_NOT_FOUND');

  const presupuesto = await prisma.presupuesto.findFirst({
    where: {
      id: presupuestoId,
      consulta: {
        botId: bot.id,
      },
    },
    include: {
      consulta: {
        include: { lead: true },
      },
    },
  });

  if (!presupuesto) {
    throw new Error('PRESUPUESTO_NOT_FOUND');
  }

  if (presupuesto.estado === 'PENDIENTE') {
    const presupuestoActualizado = await prisma.presupuesto.update({
      where: { id: presupuestoId },
      data: { estado: 'EN_PROCESO' },
      include: {
        consulta: {
          include: { lead: true },
        },
      },
    });
    return presupuestoActualizado;
  }

  return presupuesto;
}