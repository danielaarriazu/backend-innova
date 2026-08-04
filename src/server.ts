import dotenv from 'dotenv';

dotenv.config();

import app from './app';
import prisma from './lib/prisma';
import { initCronJobs } from './services/cron.service';
import { Server } from 'http';

const PORT = process.env.PORT || 3000;

// Variable para guardar la instancia del servidor HTTP
let server: Server; 

const globalAny = global as any;
  if (globalAny.cronLimpiezaInactivas) {
    console.log('[SERVER] Deteniendo tareas programadas (Cron)...');
    globalAny.cronLimpiezaInactivas.stop();
  }
  
async function startServer() {
  try {
    await prisma.$connect();
    console.log('Conectado a la base de datos PostgreSQL (Neon) exitosamente.');

    server = app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Servidor backend escuchando en puerto ${PORT}`);
      console.log(`Documentación disponible en /api-docs`);
      initCronJobs();
    });
  } catch (error) {
    console.error('Error crítico al iniciar el servidor:', error);
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string) {
  console.log(`\n[SERVER] Recibida señal ${signal}. Iniciando apagado gradual...`);

  // 1. Detener el cron global si existe para que no dispare nuevas tareas
  const globalAny = global as any;
  if (globalAny.cronLimpiezaInactivas) {
    console.log('[SERVER] Deteniendo tareas programadas (Cron)...');
    globalAny.cronLimpiezaInactivas.stop();
  }

  // 2. Timeout de seguridad: forzar el cierre si se cuelga (ej. peticiones muy largas)
  const forceExit = setTimeout(() => {
    console.error('[SERVER] Timeout de apagado alcanzado (15s). Cerrando forzosamente.');
    process.exit(1);
  }, 25_000);

  // 3. Iniciar el cierre del servidor Express
  if (server) {
    console.log('[SERVER] Cerrando servidor HTTP (esperando que terminen las peticiones en curso)...');
    server.close(async () => {
      console.log('[SERVER] Todas las peticiones HTTP finalizaron.');
      
      // 4. Desconectar Prisma de forma limpia
      try {
        await prisma.$disconnect();
        console.log('[SERVER] Conexión a Prisma (Neon) cerrada exitosamente. Apagado limpio.');
        clearTimeout(forceExit);
        process.exit(0);
      } catch (err) {
        console.error('[SERVER] Error al desconectar Prisma durante el apagado:', err);
        clearTimeout(forceExit);
        process.exit(1);
      }
    });
  } else {
    // Si el servidor HTTP nunca llegó a inicializarse pero Prisma sí
    await prisma.$disconnect();
    clearTimeout(forceExit);
    process.exit(0);
  }
}

// Escuchar señales del sistema operativo (Render usa SIGTERM)
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();