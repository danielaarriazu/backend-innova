import { NextFunction, Request, Response } from 'express';
import {
  cambiarEstadoPresupuesto,
  cotizarYActualizarPresupuesto,
  crearPresupuesto,
  crearPresupuestoPublico,
  listarPresupuestos,
  obtenerPresupuesto,
  PresupuestoError,
} from '../services/presupuesto.service';
import {
  CambiarEstadoBody,
  CotizarPresupuestoBody,
  CrearPresupuestoBody,
  CrearPresupuestoPublicoBody,
  ListarPresupuestosQuery,
} from '../schema/presupuesto.schema';

const responderErrorConocido = (error: unknown, res: Response): boolean => {
  if (!(error instanceof PresupuestoError)) return false;

  const respuestas = {
    CONSULTATION_NOT_FOUND: [404, 'La consulta no existe o no pertenece a tu negocio.'],
    PRODUCT_NOT_FOUND: [404, 'Uno de los productos no existe o no pertenece a tu negocio.'],
    BUDGET_NOT_FOUND: [404, 'El presupuesto no existe o no pertenece a tu negocio.'],
    INVALID_STATE_TRANSITION: [409, 'La transición de estado solicitada no está permitida.'],
    IDEMPOTENCY_CONFLICT: [409, 'La clave de idempotencia ya está asociada a otro recurso.'],
  } as const;

  const [status, mensaje] = respuestas[error.code];
  res.status(status).json({ success: false, error: mensaje, code: error.code });
  return true;
};

export const createPublicBudget = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = req.body as CrearPresupuestoPublicoBody;
    const resultado = await crearPresupuestoPublico({
      slug: req.params.slug,
      consultaId: req.params.id,
      items: body.items.map((item) => ({
        ...item,
        precioUnitario: item.precioUnitario ?? 0,
      })),
      diasValidez: body.diasValidez,
      idempotencyKey: body.idempotencyKey,
    });
    res.status(resultado.creado ? 201 : 200).json({
      success: true,
      duplicated: !resultado.creado,
      presupuesto: resultado.presupuesto,
    });
  } catch (error) {
    if (!responderErrorConocido(error, res)) next(error);
  }
};

export const createBudget = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = req.body as CrearPresupuestoBody;
    const resultado = await crearPresupuesto({ usuarioId: req.usuario!.id, ...body });
    res.status(resultado.creado ? 201 : 200).json({
      success: true,
      duplicated: !resultado.creado,
      presupuesto: resultado.presupuesto,
    });
  } catch (error) {
    if (!responderErrorConocido(error, res)) next(error);
  }
};

export const getBudgets = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const resultado = await listarPresupuestos(
      req.usuario!.id,
      req.query as unknown as ListarPresupuestosQuery,
    );
    res.status(200).json({ success: true, ...resultado });
  } catch (error) {
    next(error);
  }
};

export const getBudget = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const presupuesto = await obtenerPresupuesto(req.usuario!.id, Number(req.params.id));
    res.status(200).json({ success: true, presupuesto });
  } catch (error) {
    if (!responderErrorConocido(error, res)) next(error);
  }
};

export const updateBudgetStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = req.body as CambiarEstadoBody;
    const presupuesto = await cambiarEstadoPresupuesto({
      usuarioId: req.usuario!.id,
      presupuestoId: Number(req.params.id),
      estado: body.estado,
    });
    res.status(200).json({ success: true, presupuesto });
  } catch (error) {
    if (!responderErrorConocido(error, res)) next(error);
  }
};

export const cotizarPresupuesto = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = req.body as CotizarPresupuestoBody;
    const presupuesto = await cotizarYActualizarPresupuesto({
      usuarioId: req.usuario!.id,
      presupuestoId: Number(req.params.id),
      itemsCotizados: body.itemsCotizados,
      diasValidez: body.diasValidez,
    });
    res.status(200).json({
      success: true,
      mensaje: 'Presupuesto cotizado y PDF generado con éxito.',
      presupuesto,
    });
  } catch (error) {
    if (!responderErrorConocido(error, res)) next(error);
  }
};
