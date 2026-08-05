import { CerradaPor, EstadoConsulta, RolEmisor, TipoMensaje, EstadoChat, Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { AddConsultationMessageInput, CreateConsultationInput, UpdateConsultationStatusInput,} from '../types/consultation.types';
import { registrarActividad } from './activity.service';

const consultationInclude = {
  mensajes: { orderBy: { fechaCreacion: 'asc' as const } },
  lead: { select: { nombre: true, telefono: true } },
} satisfies Prisma.ConsultaInclude;

type ConsultationWithMessages = Prisma.ConsultaGetPayload<{ include: typeof consultationInclude }>;

const statusToApi = (estado: EstadoConsulta) => {
 const map: Record<EstadoConsulta, string> = {
    INICIADA: 'iniciada',
    NUEVA: 'nueva',
    EN_PROCESO: 'en_proceso',
    RESUELTA: 'resuelta',
    CERRADA: 'cerrada',
  };
  
  return map[estado];
};

const statusToDb = (estado: UpdateConsultationStatusInput['estado']): EstadoConsulta => {
  const map: Record<string, EstadoConsulta> = {
    
    iniciada: EstadoConsulta.INICIADA,
    nueva: EstadoConsulta.NUEVA,
    en_proceso: EstadoConsulta.EN_PROCESO,
    resuelta: EstadoConsulta.RESUELTA,
    cerrada: EstadoConsulta.CERRADA,
  };

  return map[estado as string]; 
};

const toConsultationDto = (consulta: ConsultationWithMessages) => ({
  id: consulta.id,
  usuarioId: null,
  sessionId: consulta.sessionId,
  clienteNombre: consulta.lead?.nombre ?? null,
  clienteTelefono: consulta.lead?.telefono ?? null,
  estado: statusToApi(consulta.estado),
  derivada: consulta.derivada,
  cerradaPor: consulta.cerradaPor === CerradaPor.BOT
    ? 'bot'
    : consulta.cerradaPor === CerradaPor.EMPRENDEDOR ? 'emprendedor' : null,
  tipoConsulta: consulta.tipoConsulta,
  canal: consulta.canal,
  asunto: consulta.asunto,
  descripcion: consulta.descripcion,
  fechaCreacion: consulta.fechaCreacion.toISOString(),
  fechaActualizacion: consulta.fechaActualizacion.toISOString(),
  fechaCierre: consulta.fechaCierre?.toISOString() ?? null,
  mensajes: consulta.mensajes.map((mensaje) => ({
    id: mensaje.id,
    consultaId: mensaje.consultaId,
    mensajePadreId: mensaje.mensajePadreId,
    emisor: mensaje.emisor,
    contenido: mensaje.contenido,
    tipoMensaje: mensaje.tipoMensaje,
    fechaCreacion: mensaje.fechaCreacion.toISOString(),
    fechaActualizacion: mensaje.fechaActualizacion.toISOString(),
    leido: mensaje.leido,
  })),
});

const getBotByUser = async (usuarioId: string) => {
  const bot = await prisma.configuracionBot.findUnique({ where: { usuarioId } });
  if (!bot) throw new Error('BOT_NOT_FOUND');
  return bot;
};

export const listarConsultas = async (usuarioId: string) => {
  const bot = await getBotByUser(usuarioId);
  const consultas = await prisma.consulta.findMany({
    where: { botId: bot.id },
    include: consultationInclude,
    orderBy: { fechaActualizacion: 'desc' },
  });
  return consultas.map(toConsultationDto);
};

export const obtenerConsulta = async (usuarioId: string, consultaId: string) => {
  const bot = await getBotByUser(usuarioId);
  const consulta = await prisma.consulta.findFirst({
    where: { id: consultaId, botId: bot.id },
    include: consultationInclude,
  });
  if (!consulta) throw new Error('CONSULTATION_NOT_FOUND');

  await prisma.presupuesto.updateMany({
    where: { consultaId: consulta.id, estado: 'PENDIENTE' },
    data: { estado: 'EN_PROCESO' },
  })
  if (consulta.estado === EstadoConsulta.NUEVA) {
    const consultaActualizada = await prisma.consulta.update({
      where: { id: consulta.id },
      data: { estado: EstadoConsulta.EN_PROCESO },
      include: consultationInclude,
    });
    return toConsultationDto(consultaActualizada);
  }
  return toConsultationDto(consulta);
};

export const actualizarEstado = async (data: UpdateConsultationStatusInput) => {
  const bot = await getBotByUser(data.usuarioId);
  const existente = await prisma.consulta.findFirst({ where: { id: data.consultaId, botId: bot.id } });
  if (!existente) throw new Error('CONSULTATION_NOT_FOUND');

  const cerrada = data.estado === 'CERRADA';
  const consulta = await prisma.consulta.update({
    where: { id: data.consultaId },
    data: {
      estado: statusToDb(data.estado),
      fechaCierre: cerrada ? new Date() : null,
      cerradaPor: cerrada ? CerradaPor.EMPRENDEDOR : null,
    },
    include: consultationInclude,
  });

  if (data.estado === 'RESUELTA' || data.estado === 'CERRADA') {
    if (consulta.sessionId) {
      try {
        await prisma.sesionChat.update({
          where: {
            botId_sessionId: {
              botId: bot.id,
              sessionId: consulta.sessionId,
            },
          },
          data: {
            estado: EstadoChat.BOT_ACTIVO, 
            contexto: 'INICIO',
          },
        });
      } catch (error) {
        // Capturamos el error de forma silenciosa para que, si por algún 
        // motivo la sesión no existe, no falle la actualización de la consulta.
        console.error(`Error al reactivar el bot para la sesión ${consulta.sessionId}:`, error);
      }
    }
  }

  await registrarActividad(
    data.usuarioId,
    'CAMBIO_ESTADO_CONSULTA',
    `El usuario cambió la consulta ${data.consultaId} al estado ${data.estado}.`,
  );
  return toConsultationDto(consulta);
};

export const crearConsultaPublica = async (data: CreateConsultationInput) => {
  const bot = await prisma.configuracionBot.findUnique({ where: { slug: data.slug } });
  if (!bot || !bot.activo) throw new Error('BOT_NOT_FOUND');
  const consulta = await prisma.consulta.create({
    data: {
      botId: bot.id,
      sessionId: data.sessionId,
      tipoConsulta: 'BOT',
      canal: data.canal ?? 'web',
      asunto: 'INTERACCION_BOT',
      descripcion: 'El cliente inicio el chat',
    },
    include: {
      ...consultationInclude,
      mensajes: true,
    }
  });
  return toConsultationDto(consulta);
};

export const agregarMensajePublico = async (data: AddConsultationMessageInput) => {
  const consulta = await prisma.consulta.findFirst({
    where: { id: data.consultaId, bot: { slug: data.slug, activo: true } },
  });
  if (!consulta) throw new Error('CONSULTATION_NOT_FOUND');

  let tipoFinal: TipoMensaje = TipoMensaje.TEXTO;

  if (data.emisor === RolEmisor.BOT) {
    tipoFinal = data.esPresupuestoBot ? TipoMensaje.PRESUPUESTO : TipoMensaje.TEXTO;
  } else if (data.emisor === RolEmisor.CLIENTE) {
    tipoFinal = data.tipoMensaje === 'ACCION' ? TipoMensaje.ACCION : TipoMensaje.TEXTO;
  }

  const mensaje = await prisma.mensaje.create({
    data: {
      consultaId: consulta.id,
      emisor: data.emisor as RolEmisor,
      contenido: data.contenido.trim(),
      tipoMensaje: tipoFinal,
      leido: data.emisor !== 'CLIENTE',
    },
  });
  return {
    ...mensaje,
    fechaCreacion: mensaje.fechaCreacion.toISOString(),
    fechaActualizacion: mensaje.fechaActualizacion.toISOString(),
  };
};

export const actualizarContactoPublico = async (
  slug: string,
  consultaId: string,
  clienteNombre: string,
  clienteTelefono: string,
) => {
  const consulta = await prisma.consulta.findFirst({
    where: { id: consultaId, bot: { slug, activo: true } },
  });
  if (!consulta) throw new Error('CONSULTATION_NOT_FOUND');

  const mensajeContacto = await prisma.mensaje.findFirst({
    where: { consultaId, emisor: RolEmisor.CLIENTE },
    orderBy: { fechaCreacion: 'desc' },
    select: { id: true },
  });

  const actualizada = await prisma.$transaction(async (tx) => {
    const mensaje = mensajeContacto ?? await tx.mensaje.create({
      data: {
        consultaId,
        emisor: RolEmisor.CLIENTE,
        tipoMensaje: TipoMensaje.TEXTO,
        contenido: clienteTelefono,
      },
      select: { id: true },
    });

    await tx.lead.upsert({
      where: { consultaId },
      update: {
        nombre: clienteNombre,
        telefono: clienteTelefono,
        mensajeId: mensaje.id,
      },
      create: {
        nombre: clienteNombre,
        telefono: clienteTelefono,
        consultaId,
        mensajeId: mensaje.id,
      },
    });

    return tx.consulta.update({
      where: { id: consultaId },
      data: {
        derivada: true,
        estado: EstadoConsulta.NUEVA,
        tipoConsulta: 'DERIVAR_HUMANO',
        asunto: 'Derivación de Chatbot',
      },
      include: consultationInclude,
    });
  });
  return toConsultationDto(actualizada);
};

export const agregarMensajeEmprendedor = async (usuarioId: string, consultaId: string, contenido: string, esPresupuesto: boolean = false) => {
  const bot = await getBotByUser(usuarioId);
  
  const consulta = await prisma.consulta.findFirst({
    where: { id: consultaId, botId: bot.id },
  });
  
  if (!consulta) throw new Error('CONSULTATION_NOT_FOUND');

  const mensaje = await prisma.mensaje.create({
    data: {
      consultaId: consulta.id,
      emisor: RolEmisor.EMPRENDEDOR,
      tipoMensaje: esPresupuesto ? TipoMensaje.PRESUPUESTO : TipoMensaje.TEXTO,
      contenido: contenido.trim(),
      leido: false,
    },
  });

  return {
    ...mensaje,
    fechaCreacion: mensaje.fechaCreacion.toISOString(),
    fechaActualizacion: mensaje.fechaActualizacion.toISOString(),
  };
};
export const actualizarControlChat = async (params: { usuarioId: string; consultaId: string; estado: EstadoChat }) => {
  const { consultaId, estado } = params;

  const consulta = await prisma.consulta.findUnique({
    where: { id: consultaId },
    select: { botId: true, sessionId: true }
  });

  if (!consulta) {
    throw new Error('CONSULTATION_NOT_FOUND');
  }

  if (!consulta.sessionId) {
    throw new Error('La consulta no tiene un sessionId asociado.');
  }
  
  const sesionActualizada = await prisma.sesionChat.update({
    where: {
      botId_sessionId: {
        botId: consulta.botId,
        sessionId: consulta.sessionId
      }
    },
    data: {
      estado,
      ...(estado === EstadoChat.BOT_ACTIVO ? { contexto: 'INICIO' } : {}),
    }
  });

  return sesionActualizada;
};

export const obtenerConsultasDerivadas = async (
  usuarioId: string,
  slug: string,
  tipoFiltro?: string,
) => {
  const whereClause: any = {
    bot: { slug, usuarioId },
    derivada: true,
  };

  if (tipoFiltro === 'atencion_personalizada') {
    whereClause.tipoConsulta = 'DERIVAR_HUMANO';
  } else if (tipoFiltro === 'cotizaciones') {
    whereClause.tipoConsulta = 'COTIZACION';
  }

  const consultas = await prisma.consulta.findMany({
    where: whereClause,
    include: {
      lead: true, 
    },
    orderBy: {
      fechaActualizacion: 'desc' 
    }
  });

  const consultasConSesion = await Promise.all(
    consultas.map(async (consulta) => {
      if (!consulta.sessionId) {
        return { ...consulta, estadoChat: null };
      }

      const sesion = await prisma.sesionChat.findUnique({
        where: {
          botId_sessionId: {
            botId: consulta.botId,
            sessionId: consulta.sessionId
          }
        },
        select: { estado: true }
      });

      return {
        ...consulta,
        estadoChat: sesion?.estado || null 
      };
    })
  );

  return consultasConSesion;
};
