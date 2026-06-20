import { Redis } from '@upstash/redis';
import { DuckDBInstance, DuckDBConnection } from '@duckdb/node-api';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.MOTHERDUCK_TOKEN;
if (!token) {
  console.error('❌ ERROR: MOTHERDUCK_TOKEN no definido en .env');
  process.exit(1);
}

// 1. Conexión a Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL as string,
  token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
});

let conn: DuckDBConnection | null = null;

// 2. Inicializar la BD con la nueva arquitectura
async function iniciarBaseDeDatos() {
  console.log('Conectando a MotherDuck (Nuevo SDK)...');
  try {
    const instance = await DuckDBInstance.create('md:my_db', {
      motherduck_token: token as string, 
    });
    conn = await instance.connect();
    console.log('Conexión a la nube establecida de forma segura.');
    
    console.log('Worker de telemetría iniciado...');
    setInterval(procesarMensajes, 10000);
    procesarMensajes(); 
  } catch (error) {
    console.error('Error crítico al inicializar MotherDuck:', error);
    process.exit(1);
  }
}

async function procesarMensajes() {
  if (!conn) return;

  try {
    let evento = await redis.rpop('telemetria-eventos') as any;

    while (evento) {
      console.log(`Procesando lote del usuario/sesión: ${evento.sessionId}`);

      const query = `
        INSERT INTO my_db.eventos_frontend (sessionId, usuarioId, ip, dispositivo, fechaServidor, eventos) 
        VALUES ($1, $2, $3, $4, CAST($5 AS TIMESTAMP), CAST($6 AS JSON))
      `;

      try {
        const stmt = await conn.prepare(query);
        
        stmt.bindVarchar(1, evento.sessionId);
        stmt.bindVarchar(2, evento.usuarioId || 'anonimo');
        stmt.bindVarchar(3, evento.ip || 'desconocida');
        stmt.bindVarchar(4, evento.dispositivo || 'desconocido');
        stmt.bindVarchar(5, evento.fechaServidor);
        stmt.bindVarchar(6, JSON.stringify(evento.eventos));

        
        await stmt.run();
        
        console.log('Eventos insertados correctamente en MotherDuck');
        
      } catch (dbError: any) {
        console.error('Error insertando en MotherDuck:', dbError.message);
        await redis.lpush('telemetria-eventos', evento);
        break; 
      }

      
      evento = await redis.rpop('telemetria-eventos');
    }

  } catch (error) {
    console.error('Error crítico en el worker:', error);
  }
}

iniciarBaseDeDatos();