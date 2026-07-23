import { PrismaClient, Prisma } from '@prisma/client';
import { generarPresupuestoFormal, ItemPresupuesto, DatosNegocio } from './pdf.service';

const prisma = new PrismaClient();

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

export async function crearYEnviarPresupuesto(consultaId: string, items: ItemPresupuesto[]) {
  
  // Calculamos la fecha de vencimiento (ej: 10 días desde hoy)
  const diasValidez = 10;
  const fechaVencimiento = new Date();
  fechaVencimiento.setDate(fechaVencimiento.getDate() + diasValidez);

  // 1. Guardar el presupuesto en la BD con estado 'PENDIENTE' o 'ENVIADO'
  const nuevoPresupuesto = await prisma.presupuesto.create({
    data: {
      consultaId: consultaId, // Ahora es String, como lo arreglamos recién
      estado: 'PENDIENTE', 
      detalle: items as unknown as Prisma.InputJsonArray,
      validezDias: diasValidez,
      fechaVencimiento: fechaVencimiento
    }
  });

  // 2. Generar el PDF físico con los datos recién guardados
  const rutaPdf = await generarPdfDesdeBaseDeDatos(nuevoPresupuesto.id);

  // 3. Retornar la ruta
  return rutaPdf;
}