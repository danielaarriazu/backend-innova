import { Request, Response } from 'express';
import { cotizarYActualizarPresupuesto } from '../services/presupuesto.service';
import { ItemPresupuesto } from '../types/pdf.types';

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
      detalle: error.message 
    });
  }
};