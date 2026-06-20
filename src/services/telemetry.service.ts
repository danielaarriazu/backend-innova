import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL as string,
  token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
});

interface TelemetryData {
  sessionId: string;
  usuarioId?: string;
  ip?: string;
  dispositivo?: string;
  eventos: any[];
}

export const enviarEventosQueue = async (data: TelemetryData): Promise<void> => {
  try {
    const payload = {
      ...data,
      fechaServidor: new Date().toISOString(),
    };

    await redis.lpush('telemetria-eventos', payload);
    console.log(`[API] Eventos de la sesión ${data.sessionId} encolados en Redis!`);
        
  } catch (error) {
    console.error('[TELEMETRY ERROR]: No se pudo enviar a Redis', error);
  }
};