export type ConsultationStatus = 'NUEVA' | 'EN_PROCESO' | 'RESUELTA' | 'CERRADA';
export type ConsultationSender = 'CLIENTE' | 'EMPRENDEDOR' | 'BOT';
export type TipoMensaje = 'TEXTO' | 'ACCION' | 'PRESUPUESTO';

export interface CreateConsultationInput {
  slug: string;
  sessionId?: string;
  tipoConsulta?: string;
  canal?: string;
  asunto?: string;
  descripcion?: string;
}

export interface AddConsultationMessageInput {
  slug: string;
  consultaId: string;
  emisor: ConsultationSender;
  contenido: string;
  tipoMensaje?: string;
}

export interface UpdateConsultationStatusInput {
  usuarioId: string;
  consultaId: string;
  estado: ConsultationStatus;
}