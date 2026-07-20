export interface TelemetryData {
  botId?: string;
  tipoUsuario?: 'ANONIMO' | 'EMPRENDEDOR' | 'CLIENTE';
  sessionId: string;
  usuarioId?: string; 
  ip?: string;
  dispositivo?: string;
  eventos: any[];
}