import { Request, Response, NextFunction } from 'express';
import { actualizarEstadoPresupuesto, 
         cotizarYActualizarPresupuesto,
         obtenerPresupuestoPorId, 
         obtenerPresupuestosFiltrados,
         crearPresupuestoPublico } from '../services/presupuesto.service';
import { ItemPresupuesto } from '../types/pdf.types';

const responderErrorConocido = (error: unknown, res: Response): boolean => {
  if (!(error instanceof Error)) return false;
  if (error.message === 'BOT_NOT_FOUND') {
    res.status(404).json({ success: false, error: 'Configuración de bot no encontrada.' });
    return true;
  }
  if (error.message === 'CONSULTATION_NOT_FOUND') {
    res.status(404).json({ success: false, error: 'Consulta no encontrada.' });
    return true;
  }
  if (error.message === 'PRODUCTO_NOT_FOUND') {
    res.status(400).json({ success: false, error: 'Uno o más productos no existen o no están activos en este catálogo.' });
    return true;
  }
  return false;
};

export const createPublicBudget = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const resultado = await crearPresupuestoPublico({
      slug: req.params.slug,
      consultaId: req.params.id,
      items: req.body.items,
    });

    res.status(201).json({
      success: true,
      presupuesto: resultado.presupuesto,
      requiereCotizacionManual: resultado.requiereCotizacionManual,
      total: resultado.total,
      consulta: resultado.consulta,
    });
  } catch (error: unknown) {
    if (!responderErrorConocido(error, res)) next(error);
  }
};

export const cotizarPresupuesto = async (req: Request, res: Response): Promise<void> => {
  try {
    
    const presupuestoId = Number(req.params.id);
    // Items con precios 
    const itemsCotizados = req.body.itemsCotizados as ItemPresupuesto[];

    const rutaPdf = await cotizarYActualizarPresupuesto(
      presupuestoId, 
      itemsCotizados
    );

    res.status(200).json({
      mensaje: 'Presupuesto cotizado, actualizado y PDF generado con éxito.',
      rutaPdf: rutaPdf
    });

  } catch (error: any) {
    console.error('[ERROR] Error al cotizar presupuesto en el controller:', error);
    res.status(500).json({ 
      error: 'Ocurrió un error interno al actualizar el presupuesto.',
        ...(process.env.NODE_ENV !== 'production' && { detalle: error.message }),
    });
  }
};

export const listarPresupuestos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const usuarioId = req.usuario!.id;
    const filtros = req.query as any;

    const resultado = await obtenerPresupuestosFiltrados(usuarioId, filtros);
    res.status(200).json({ success: true, ...resultado });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'BOT_NOT_FOUND') {
      res.status(404).json({ success: false, error: 'Configuración de bot no encontrada.' });
      return;
    }
    next(error);
  }
};

export const cambiarEstadoPresupuesto = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const usuarioId = req.usuario!.id;
    const presupuestoId = Number(req.params.id);
    const { estado } = req.body;

    const presupuestoActualizado = await actualizarEstadoPresupuesto(usuarioId, presupuestoId, estado);

    res.status(200).json({
      success: true,
      mensaje: `Estado del presupuesto actualizado a ${estado} con éxito.`,
      presupuesto: presupuestoActualizado,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'BOT_NOT_FOUND') {
        res.status(404).json({ success: false, error: 'Configuración de bot no encontrada.' });
        return;
      }
      if (error.message === 'PRESUPUESTO_NOT_FOUND') {
        res.status(404).json({ success: false, error: 'Presupuesto no encontrado o no pertenece a tu bot.' });
        return;
      }
    }
    next(error);
  }
};

export const obtenerPresupuestoDetalle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const usuarioId = req.usuario!.id;
    const presupuestoId = Number(req.params.id);

    const presupuesto = await obtenerPresupuestoPorId(usuarioId, presupuestoId);

    res.status(200).json({
      success: true,
      presupuesto,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'BOT_NOT_FOUND') {
        res.status(404).json({ success: false, error: 'Configuración de bot no encontrada.' });
        return;
      }
      if (error.message === 'PRESUPUESTO_NOT_FOUND') {
        res.status(404).json({ success: false, error: 'Presupuesto no encontrado o no pertenece a tu bot.' });
        return;
      }
    }
    next(error);
  }
};