export interface ChangePasswordInput {
  usuarioId: string;
  passwordActual: string;
  nuevaPassword: string;
  ip?: string;
  dispositivo?: string;
}

export interface DeleteAccountInput {
  usuarioId: string;
  ip?: string;
  dispositivo?: string;
}