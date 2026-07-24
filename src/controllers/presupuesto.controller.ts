import { Request, Response } from 'express';
import { cotizarYActualizarPresupuesto } from '../services/presupuesto.service';
import { ItemPresupuesto } from '../services/pdf.service';

export const cotizarPresupuesto = async (req: Request, res: Response): Promise<void> => {
  try {
    // Obtenemos el ID de la URL
    const { id } = req.params;
    const presupuestoId = Number(id); // El servicio espera un number
    
    if (isNaN(presupuestoId)) {
      res.status(400).json({ error: 'El ID del presupuesto debe ser un número válido.' });
      return;
    }

    // Items con precios del cuerpo de la petición
    const { itemsCotizados } = req.body;

    if (!itemsCotizados || !Array.isArray(itemsCotizados)) {
      res.status(400).json({ error: 'Debes enviar un array de itemsCotizados válido.' });
      return;
    }

    const rutaPdf = await cotizarYActualizarPresupuesto(
      presupuestoId, 
      itemsCotizados as ItemPresupuesto[]
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