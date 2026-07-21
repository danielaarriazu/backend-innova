import { NextFunction, Request, Response } from 'express';
import * as consultationService from '../services/consultation.service';

const handleKnownError = (error: unknown, res: Response): boolean => {
  if (!(error instanceof Error)) return false;
  if (error.message === 'BOT_NOT_FOUND') {
    res.status(404).json({ success: false, error: 'Configuración de bot no encontrada.' });
    return true;
  }
  if (error.message === 'CONSULTATION_NOT_FOUND') {
    res.status(404).json({ success: false, error: 'Consulta no encontrada.' });
    return true;
  }
  return false;
};

export const getConsultations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const consultas = await consultationService.listarConsultas(req.usuario!.id);
    res.status(200).json({ success: true, consultas });
  } catch (error: unknown) {
    if (!handleKnownError(error, res)) next(error);
  }
};

export const getConsultation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const consulta = await consultationService.obtenerConsulta(req.usuario!.id, req.params.id);
    res.status(200).json({ success: true, consulta });
  } catch (error: unknown) {
    if (!handleKnownError(error, res)) next(error);
  }
};

export const updateConsultationStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const consulta = await consultationService.actualizarEstado({
      usuarioId: req.usuario!.id,
      consultaId: req.params.id,
      estado: req.body.estado,
    });
    res.status(200).json({ success: true, message: 'Estado actualizado con éxito.', consulta });
  } catch (error: unknown) {
    if (!handleKnownError(error, res)) next(error);
  }
};

export const createPublicConsultation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const consulta = await consultationService.crearConsultaPublica({ slug: req.params.slug, ...req.body });
    res.status(201).json({ success: true, consulta });
  } catch (error: unknown) {
    if (!handleKnownError(error, res)) next(error);
  }
};

export const addPublicConsultationMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const mensaje = await consultationService.agregarMensajePublico({
      slug: req.params.slug,
      consultaId: req.params.id,
      ...req.body,
    });
    res.status(201).json({ success: true, mensaje });
  } catch (error: unknown) {
    if (!handleKnownError(error, res)) next(error);
  }
};

export const updatePublicConsultationContact = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const consulta = await consultationService.actualizarContactoPublico(
      req.params.slug,
      req.params.id,
      req.body.clienteNombre,
      req.body.clienteTelefono,
    );
    res.status(200).json({ success: true, consulta });
  } catch (error: unknown) {
    if (!handleKnownError(error, res)) next(error);
  }
};