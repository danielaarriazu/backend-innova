import { CerradaPor, EstadoConsulta, RolEmisor, TipoMensaje, Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { AddConsultationMessageInput, CreateConsultationInput, UpdateConsultationStatusInput,} from '../types/consultation.types';
import { registrarActividad } from './activity.service';

const consultationInclude = {
  mensajes: { orderBy: { fechaCreacion: 'asc' as const } },
} satisfies Prisma.ConsultaInclude;

type ConsultationWithMessages = Prisma.ConsultaGetPayload<{ include: typeof consultationInclude }>;

const statusToApi = (estado: EstadoConsulta) => {
 const map: Record<EstadoConsulta, string> = {
    NUEVA: 'nueva',
    EN_PROCESO: 'en_proceso',
    RESUELTA: 'resuelta',
    CERRADA: 'cerrada',
  };
  
  return map[estado];
};

const statusToDb = (estado: UpdateConsultationStatusInput['estado']): EstadoConsulta => {
  const map: Record<string, EstadoConsulta> = {
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
  clienteNombre: consulta.clienteNombre,
  clienteTelefono: consulta.clienteTelefono,
  estado: statusToApi(consulta.estado),
  derivada: consulta.derivada,
  cerradaPor: consulta.cerradaPor === CerradaPor.BOT
    ? 'bot'
    : consulta.cerradaPor === CerradaPor.EMPRENDEDOR ? 'emprendedor' : null,
  tipoConsulta: consulta.tipoConsulta,
  prioridad: consulta.prioridad,
  canal: consulta.canal,
  asunto: consulta.asunto,
  descripcion: consulta.descripcion,
  derivadaA: consulta.derivadaA,
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
  console.log("🚨 [DEBUG] Payload recibido en crearConsultaPublica:", JSON.stringify(data, null, 2));
  const consulta = await prisma.consulta.create({
    data: {
      botId: bot.id,
      sessionId: data.sessionId,
      clienteNombre: data.clienteNombre,
      clienteTelefono: data.clienteTelefono,
      tipoConsulta: data.tipoConsulta,
      prioridad: data.prioridad ?? 'normal',
      canal: data.canal ?? 'web',
      asunto: data.asunto,
      descripcion: data.descripcion,
    },
    include: consultationInclude,
  });
  return toConsultationDto(consulta);
};

export const agregarMensajePublico = async (data: AddConsultationMessageInput) => {
  const consulta = await prisma.consulta.findFirst({
    where: { id: data.consultaId, bot: { slug: data.slug, activo: true } },
  });
  if (!consulta) throw new Error('CONSULTATION_NOT_FOUND');

  const mensaje = await prisma.mensaje.create({
    data: {
      consultaId: consulta.id,
      emisor: data.emisor as RolEmisor,
      contenido: data.contenido.trim(),
      tipoMensaje: (data.tipoMensaje as TipoMensaje) ?? 'TEXTO',
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

  const actualizada = await prisma.consulta.update({
    where: { id: consultaId },
    data: {
      clienteNombre: clienteNombre.trim(),
      clienteTelefono: clienteTelefono.trim(),
      derivada: true,
      estado: EstadoConsulta.EN_PROCESO,
    },
    include: consultationInclude,
  });
  return toConsultationDto(actualizada);
};

export const agregarMensajeEmprendedor = async (usuarioId: string, consultaId: string, contenido: string) => {
  const bot = await getBotByUser(usuarioId);
  
  const consulta = await prisma.consulta.findFirst({
    where: { id: consultaId, botId: bot.id },
  });
  
  if (!consulta) throw new Error('CONSULTATION_NOT_FOUND');

  const mensaje = await prisma.mensaje.create({
    data: {
      consultaId: consulta.id,
      emisor: RolEmisor.EMPRENDEDOR,
      tipoMensaje: TipoMensaje.TEXTO,
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