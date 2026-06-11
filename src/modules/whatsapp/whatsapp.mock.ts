// Simulación de whatsapp-web.js para desarrollo sin Puppeteer
// En producción se reemplaza por el cliente real de WhatsApp Web JS
export interface SimulatedMessage {
  from: string;
  body: string;
  timestamp: Date;
}
export interface SimulatedResponse {
  to: string;
  body: string;
  sentAt: Date;
}
const sessions = new Map<string, boolean>();
export const initWhatsAppSession = async (sessionId: string): Promise<void> => {
  sessions.set(sessionId, true);
};
export const sendMessage = async (
  to: string,
  body: string,
  sessionId: string
): Promise<SimulatedResponse> => {
  if (!sessions.get(sessionId)) {
    throw new Error(`Sesión ${sessionId} no inicializada`);
  }
  return { to, body, sentAt: new Date() };
};

export const getSessionStatus = (sessionId: string): 'connected' | 'disconnected' =>
  sessions.get(sessionId) ? 'connected' : 'disconnected';
export const simulateIncoming = (msg: SimulatedMessage): SimulatedMessage => msg;
