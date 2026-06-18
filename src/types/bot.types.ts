export interface UpdateBotInput {
  usuarioId: string;
  activo?: boolean;
  nombreNegocio?: string;
  logoUrl?: string;
  mensajeBienvenida?: string;
  mensajeFueraHorario?: string;
  derivacionAutomatica?: boolean;
  ip?: string;
  dispositivo?: string;
}