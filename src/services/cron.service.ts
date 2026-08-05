import cron from 'node-cron';
import prisma from '../lib/prisma';
import { EstadoConsulta, CerradaPor, MotivoCierre } from '@prisma/client';

export async function limpiarConsultasInactivas() {
  try {
    // Calculamos la hora exacta de hace 60 minutos
    const hace60Minutos = new Date(Date.now() - 60 * 60 * 1000);
    const LOTE_MAXIMO = 100;

    // 1. Buscamos primero las consultas que cumplen los criterios
    const consultasInactivas = await prisma.consulta.findMany({
      where: {
        derivada: false,
        estado: EstadoConsulta.NUEVA,
        fechaActualizacion: { lt: hace60Minutos },
        sessionId: { not: null },
      },
      select: {
        id: true,
        sessionId: true,
        botId: true,
      },
      take: LOTE_MAXIMO,
    });

    // Si no hay consultas colgadas return
    if (consultasInactivas.length === 0) return;

    const operaciones = [];

    //Actualización masiva de las consultas encontradas
    const resultadoConsultas = await prisma.consulta.updateMany({
        where: {
          id: { in: consultasInactivas.map((c) => c.id) },
          estado: EstadoConsulta.NUEVA,
        },
        data: {
          estado: EstadoConsulta.RESUELTA,
          cerradaPor: CerradaPor.BOT,
          MotivoCierre: MotivoCierre.INACTIVIDAD,
          fechaCierre: new Date(),
        },
      }
    );
    let sesionesReiniciadas = 0;

    // Reseteo individual de cada sesión asociada
    for (const consulta of consultasInactivas) {
      if (consulta.sessionId) {
       try {
          await prisma.sesionChat.update({
            where: {
              botId_sessionId: {
                botId: consulta.botId,
                sessionId: consulta.sessionId,
              },
            },
            data: {
              estado: 'BOT_ACTIVO',
              contexto: 'INICIO',
            },
          });
       sesionesReiniciadas++;
        } catch (error) {
          console.warn(`[CRON] Advertencia: No se pudo reiniciar la sesión ${consulta.sessionId} (Bot: ${consulta.botId}). Es posible que el registro no exista.`);
        }
      }
    }

    console.log(`[CRON] Se cerraron ${resultadoConsultas.count} consultas inactivas y se reiniciaron ${sesionesReiniciadas} sesiones.`);
  } catch (error) {
    console.error('[CRON] Error crítico al limpiar consultas inactivas:', error);
  }
}

export function initCronJobs() {
  cron.schedule('*/15 * * * *', async () => {
    await limpiarConsultasInactivas();
  });

  console.log('[CRON] Servicio de limpieza de consultas inactivas inicializado.');
}