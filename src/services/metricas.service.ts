import prisma from '../lib/prisma';

const ZONA_HORARIA_ARGENTINA = 'America/Argentina/Buenos_Aires';

function obtenerFechaLocal(fecha: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA_ARGENTINA }).format(fecha);
}

export async function obtenerResumenDashboard(usuarioId: string) {
  const bot = await prisma.configuracionBot.findUnique({ where: { usuarioId } });
  if (!bot) throw new Error('BOT_NOT_FOUND');
  const botId = bot.id;

  const [
    totalConsultas,
    consultasPendientes,
    consultasResueltasBot,
    totalPresupuestos
  ] = await prisma.$transaction([
    prisma.consulta.count({ where: { botId } }),
    // Ajustá 'EN_PROCESO' al estado que uses para "Requieren seguimiento"
    prisma.consulta.count({ where: { botId, estado: 'EN_PROCESO', derivada: true } }), 
    prisma.consulta.count({ where: { botId, tipoConsulta: 'BOT' } }),
    prisma.presupuesto.count({ where: { consulta: { botId } } })
  ]);

  const porcentajeAutomatizacion = totalConsultas > 0 
    ? Math.round((consultasResueltasBot / totalConsultas) * 100) 
    : 0;

  return {
    consultasPendientes,
    presupuestosRegistrados: totalPresupuestos,
    automatizacionEstimada: {
      porcentaje: porcentajeAutomatizacion,
      texto: `${consultasResueltasBot} de ${totalConsultas} consultas fueron resueltas por el bot`
    },
    consultasResueltas: consultasResueltasBot
  };
}

export async function obtenerEstadisticasMetricas(usuarioId: string) {
  const bot = await prisma.configuracionBot.findUnique({ where: { usuarioId } });
  if (!bot) throw new Error('BOT_NOT_FOUND');
  const botId = bot.id;

  // Calculamos la fecha de hace 7 días exactos a las 00:00
  const fechaHace7Dias = new Date();
  fechaHace7Dias.setDate(fechaHace7Dias.getDate() - 6); 
  fechaHace7Dias.setHours(0, 0, 0, 0);

  const [
    totalConsultas,
    totalPresupuestos,
    ventasConcretadas,
    consultasDerivadas,
    presupuestosPorEstado,
    consultasUltimosDias,
    presupuestosUltimosDias
  ] = await prisma.$transaction([
    prisma.consulta.count({ where: { botId } }),
    prisma.presupuesto.count({ where: { consulta: { botId } } }),
    prisma.presupuesto.count({ where: { consulta: { botId }, estado: 'CONCRETADO' } }),
    prisma.consulta.count({ where: { botId, derivada: true } }),
    
    prisma.presupuesto.groupBy({
      by: ['estado'],
      _count: { _all: true },
      where: { consulta: { botId } },
      orderBy: { estado: 'asc' }
    }),

    prisma.consulta.findMany({
      where: { botId, fechaCreacion: { gte: fechaHace7Dias } },
      select: { fechaCreacion: true }
    }),
    prisma.presupuesto.findMany({
      where: { consulta: { botId }, fechaCreacion: { gte: fechaHace7Dias } },
      select: { fechaCreacion: true }
    })
  ]);

  const tasaConversion = totalConsultas > 0 
    ? Math.round((ventasConcretadas / totalConsultas) * 100) 
    : 0;

  // Generamos un array con los últimos 7 días ordenados cronológicamente
  const nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const actividadSemanal: { 
    dia: string; 
    fechaString: string; 
    consultas: number; 
    presupuestos: number 
  }[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    actividadSemanal.push({
      dia: nombresDias[d.getDay()],
      fechaString: d.toISOString().split('T')[0], // Para agrupar exacto
      consultas: 0,
      presupuestos: 0
    });
  }

  // Cargamos el array de la semana con los datos reales
   consultasUltimosDias.forEach(c => {
    const fechaStr = obtenerFechaLocal(c.fechaCreacion);
    const diaEncontrado = actividadSemanal.find(d => d.fechaString === fechaStr);
    if (diaEncontrado) diaEncontrado.consultas += 1;
  });
 
  presupuestosUltimosDias.forEach(p => {
    const fechaStr = obtenerFechaLocal(p.fechaCreacion);
    const diaEncontrado = actividadSemanal.find(d => d.fechaString === fechaStr);
    if (diaEncontrado) diaEncontrado.presupuestos += 1;
  });

  return {
    resumenTotal: {
      conversaciones: totalConsultas,
      presupuestos: totalPresupuestos,
      ventasConcretadas,
      tasaConversion: tasaConversion, // Front agrega el "%"
      derivadasAPersona: consultasDerivadas
    },
    evolucionSemanal: actividadSemanal.map(({ dia, consultas, presupuestos }) => ({
      dia,
      consultas,
      presupuestos
    })),
    estadoPresupuestos: presupuestosPorEstado.map(p => ({
      estado: p.estado.charAt(0) + p.estado.slice(1).toLowerCase(), 
      cantidad: (p._count as any)._all ?? 0
    }))
  };
}