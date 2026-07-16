import { Redis } from '@upstash/redis';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// 1. Validaciones de variables de entorno
if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.error('❌ ERROR: Variables de Redis no definidas en .env');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL para Prisma no definida en .env');
  process.exit(1);
}

const REDIS_KEY = 'telemetria-eventos';

// 2. Esquema Zod de eventos en Redis
const redisEventoSchema = z.object({
  botId:         z.string().optional(),
  sessionId:     z.string().min(1).max(200),
  tipoUsuario:   z.string().optional(),
  usuarioId:     z.string().optional(),
  ip:            z.string().optional(),
  dispositivo:   z.string().optional(),
  fechaServidor: z.string().min(1),
  eventos:       z.array(z.record(z.string(), z.unknown())).min(1).max(200),
});

type RedisEvento = z.infer<typeof redisEventoSchema>;

// 3. Inicialización de clientes
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL as string,
  token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
});

const prisma = new PrismaClient();

let isRunning = false;
let shutdownRequested = false;

async function iniciarWorker() {
  console.log('Conectando a la base de datos con Prisma...');
  try {
    // Verificamos conexión a la BD
    await prisma.$connect();
    console.log('Conexión a la base de datos establecida con éxito.');
    console.log('Worker de telemetría iniciado.');

    // Ejecutar inmediatamente y programar intervalo
    procesarMensajes();
    setInterval(() => {
      if (!isRunning && !shutdownRequested) procesarMensajes();
    }, 10000);
  } catch (error) {
    console.error('Error crítico al inicializar la conexión con Prisma:', error);
    process.exit(1);
  }
}

async function procesarMensajes() {
  if (isRunning) return;

  isRunning = true;

  try {
    let raw = await redis.rpop(REDIS_KEY);

    while (raw && !shutdownRequested) {
      // 1. Validar el payload antes de procesar
      const parseResult = redisEventoSchema.safeParse(raw);

      if (!parseResult.success) {
        console.error('[WORKER] Evento malformado descartado:', JSON.stringify(raw));
        console.error('[WORKER] Errores de validación:', parseResult.error.issues);
        // Descartar y continuar
        raw = await redis.rpop(REDIS_KEY);
        continue;
      }

      const evento: RedisEvento = parseResult.data;
      console.log(`[WORKER] Procesando sesión: ${evento.sessionId}`);

      try {
        // 2. Inserción usando Prisma
        await prisma.eventoTelemetry.create({
          data: {
            botId: evento.botId ?? null,
            sessionId: evento.sessionId,
            tipoUsuario: evento.tipoUsuario ?? 'ANONIMO',
            usuarioId: evento.usuarioId ?? null,
            ip: evento.ip ?? 'desconocida',
            dispositivo: evento.dispositivo ?? 'desconocido',
            fechaServidor: new Date(evento.fechaServidor),
            // Prisma maneja objetos/arrays de JS directamente en campos tipo Json
            eventos: evento.eventos as Prisma.InputJsonArray,
          },
        });

        console.log('[WORKER] Evento insertado en la base de datos.');
      } catch (dbError: any) {
        console.error('[WORKER] Error insertando en la base de datos:', dbError.message);
        // Reencolar el evento en caso de fallo en BD
        await redis.lpush(REDIS_KEY, raw);
        break;
      }

      raw = await redis.rpop(REDIS_KEY);
    }
  } catch (error) {
    console.error('[WORKER] Error crítico en el loop:', error);
  } finally {
    isRunning = false;
  }
}

async function manejarApagado(señal: string) {
  console.log(`[WORKER] ${señal} recibido. Esperando mensaje en curso antes de cerrar...`);
  shutdownRequested = true;

  const timeout = setTimeout(async () => {
    console.log('[WORKER] Timeout de apagado. Cerrando forzosamente.');
    await prisma.$disconnect();
    process.exit(0);
  }, 15_000);

  const intervalo = setInterval(async () => {
    if (!isRunning) {
      clearTimeout(timeout);
      clearInterval(intervalo);
      await prisma.$disconnect();
      console.log('[WORKER] Conexión a Prisma cerrada. Apagado limpio. Hasta luego.');
      process.exit(0);
    }
  }, 200);
}

process.on('SIGTERM', () => manejarApagado('SIGTERM'));
process.on('SIGINT', () => manejarApagado('SIGINT'));

iniciarWorker();