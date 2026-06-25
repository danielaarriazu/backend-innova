import { Redis } from '@upstash/redis';
import { DuckDBInstance, DuckDBConnection } from '@duckdb/node-api';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.MOTHERDUCK_TOKEN;
if (!token) {
  console.error('❌ ERROR: MOTHERDUCK_TOKEN no definido en .env');
  process.exit(1);
}

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.error('❌ ERROR: Variables de Redis no definidas en .env');
  process.exit(1);
}

const REDIS_KEY = 'telemetria-eventos';

const redisEventoSchema = z.object({
  sessionId:     z.string().min(1).max(200),
  usuarioId:     z.string().optional(),
  ip:            z.string().optional(),
  dispositivo:   z.string().optional(),
  fechaServidor: z.string().min(1),
  eventos:       z.array(z.record(z.string(), z.unknown())).min(1).max(200),
});

type RedisEvento = z.infer<typeof redisEventoSchema>;
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL as string,
  token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
});

let conn: DuckDBConnection | null = null;

async function iniciarBaseDeDatos() {
  console.log('Conectando a MotherDuck...');
  try {
    const instance = await DuckDBInstance.create('md:my_db', {
      motherduck_token: token as string,
    });
    conn = await instance.connect();
    console.log('Conexión a MotherDuck establecida.');
    console.log('Worker de telemetría iniciado.');

    procesarMensajes();
    setInterval(() => {
      if (!isRunning) procesarMensajes(); 
    }, 10000);
  } catch (error) {
    console.error('Error crítico al inicializar MotherDuck:', error);
    process.exit(1);
  }
}

let isRunning = false;       
let shutdownRequested = false;

async function procesarMensajes() {
  if (!conn || isRunning) return;

  isRunning = true;

  try {
    let raw = await redis.rpop(REDIS_KEY);

    while (raw && !shutdownRequested) {
      // 1. Validar el payload antes de tocarlo
      const parseResult = redisEventoSchema.safeParse(raw);

      if (!parseResult.success) {
        console.error('[WORKER] Evento malformado descartado:', JSON.stringify(raw));
        console.error('[WORKER] Errores de validación:', parseResult.error.issues);
        // Descartamos y seguimos — no reencolar basura
        raw = await redis.rpop(REDIS_KEY);
        continue;
      }

      const evento: RedisEvento = parseResult.data;
      console.log(`[WORKER] Procesando sesión: ${evento.sessionId}`);

      const query = `
        INSERT INTO my_db.eventos_frontend (sessionId, usuarioId, ip, dispositivo, fechaServidor, eventos)
        VALUES ($1, $2, $3, $4, CAST($5 AS TIMESTAMP), CAST($6 AS JSON))
      `;

      try {
        const stmt = await conn.prepare(query);

        stmt.bindVarchar(1, evento.sessionId);
        stmt.bindVarchar(2, evento.usuarioId  ?? 'anonimo');
        stmt.bindVarchar(3, evento.ip         ?? 'desconocida');
        stmt.bindVarchar(4, evento.dispositivo ?? 'desconocido');
        stmt.bindVarchar(5, evento.fechaServidor);
        stmt.bindVarchar(6, JSON.stringify(evento.eventos));

        await stmt.run();

        console.log('[WORKER] Evento insertado en MotherDuck.');
      } catch (dbError: any) {
        console.error('[WORKER] Error insertando en MotherDuck:', dbError.message);
        await redis.lpush(REDIS_KEY, evento);
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
function manejarApagado(señal: string) {
  console.log(`[WORKER] ${señal} recibido. Esperando mensaje en curso antes de cerrar...`);
  shutdownRequested = true;

  // Esperamos hasta 15s a que isRunning quede en false, luego salimos igual
  const timeout = setTimeout(() => {
    console.log('[WORKER] Timeout de apagado. Cerrando forzosamente.');
    process.exit(0);
  }, 15_000);

  const intervalo = setInterval(() => {
    if (!isRunning) {
      clearTimeout(timeout);
      clearInterval(intervalo);
      console.log('[WORKER] Apagado limpio. Hasta luego.');
      process.exit(0);
    }
  }, 200);
}

process.on('SIGTERM', () => manejarApagado('SIGTERM'));
process.on('SIGINT',  () => manejarApagado('SIGINT'));


iniciarBaseDeDatos();