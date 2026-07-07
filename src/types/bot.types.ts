export interface UpdateBotInput {
  usuarioId: string;
  activo?: boolean;
  nombreNegocio?: string;
  rubroId?: string;
  descripcionBreve?: string;
  horarioAtencion?: string;
  telefono?: string;
  respuestaDerivacion?: string;
  logoUrl?: string;
  mensajeBienvenida?: string;
  mensajeFueraHorario?: string;
  derivacionAutomatica?: boolean;
  ip?: string;
  dispositivo?: string;
}