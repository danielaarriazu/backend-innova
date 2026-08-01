import { Request, Response, NextFunction } from 'express';
import { obtenerResumenDashboard, obtenerEstadisticasMetricas } from '../services/metricas.service';

export const getDashboardData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const usuarioId = req.usuario!.id; 
    const datos = await obtenerResumenDashboard(usuarioId);
    res.status(200).json({ success: true, data: datos });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'BOT_NOT_FOUND') {
      res.status(404).json({ success: false, error: 'Configuración de bot no encontrada.' });
      return;
    }
    next(error);
  }
};

export const getMetricasData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const usuarioId = req.usuario!.id; 
    const datos = await obtenerEstadisticasMetricas(usuarioId);
    res.status(200).json({ success: true, data: datos });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'BOT_NOT_FOUND') {
      res.status(404).json({ success: false, error: 'Configuración de bot no encontrada.' });
      return;
    }
    next(error);
  }
};