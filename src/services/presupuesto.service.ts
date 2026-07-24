import { PrismaClient, Prisma } from '@prisma/client';
import { generarPresupuestoFormal, ItemPresupuesto, DatosNegocio } from './pdf.service';
import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

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
  
export async function crearYEnviarPresupuesto(consultaId: string, items: ItemPresupuesto[]) {
  
  const nuevoPresupuesto = await prisma.presupuesto.create({
    data: {
      consultaId: consultaId, // Ahora es String, como lo arreglamos recién
      estado: 'ENVIADO', 
      detalle: items as unknown as Prisma.InputJsonArray,
      validezDias: diasValidez,
      fechaVencimiento: fechaVencimiento
    }
  });

  const rutaPdf = await generarPdfDesdeBaseDeDatos(nuevoPresupuesto.id);

  const nombreParaNube = path.basename(rutaPdf, '.pdf');

  let urlCloudinary = '';
  try {
    const uploadResult = await cloudinary.uploader.upload(rutaPdf, {
      folder: 'presupuestos_clientes', // Lo guardamos en una carpeta
      resource_type: 'auto', 
      public_id: nombreParaNube, // Nombre único
      format: 'pdf' // Aseguramos que sea PDF
    });
    
    urlCloudinary = uploadResult.secure_url; // Obtenemos el link HTTPS
  } catch (error) {
    console.error('[ERROR] Falló la subida a Cloudinary:', error);
    throw new Error('Se generó el PDF pero no se pudo subir a la nube.');
  } finally {
  // Borramos el archivo local para mantener limpio el servidor
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
        where: { id: nuevoPresupuesto.id },
        data: { linkPdf: urlCloudinary }
      });
    } catch (error) {
      console.error('[ERROR] Se subió el PDF pero falló al guardar la URL en la BD:', error);
    }
  }

  return urlCloudinary;
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
      fechaVencimiento: fechaVencimiento
    }
  });

  const rutaPdfGenerado = await generarPdfDesdeBaseDeDatos(presupuestoId);

  const nombreParaNube = path.basename(rutaPdfGenerado, '.pdf');

  let urlCloudinary = '';
  try {
    const uploadResult = await cloudinary.uploader.upload(rutaPdfGenerado, {
      folder: 'presupuestos_clientes', // Lo guardamos en una carpeta
      resource_type: 'raw', 
      public_id: nombreParaNube, // Nombre único
      format: 'pdf' // Aseguramos que sea PDF
    });
    
    urlCloudinary = uploadResult.secure_url; // Obtenemos el link HTTPS
  } catch (error) {
    console.error('[ERROR] Falló la subida a Cloudinary:', error);
    throw new Error('Se generó el PDF pero no se pudo subir a la nube.');
  } finally {
  // Borramos el archivo local para mantener limpio el servidor
  try {
    if (fs.existsSync(rutaPdfGenerado)) {
      fs.unlinkSync(rutaPdfGenerado);
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