import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { registrarActividad } from './activity.service';
import {
  CreateFaqInput,
  CreateFaqsFromSuggestionsInput,
  DeleteFaqInput,
  GetFaqsInput,
  UpdateFaqInput,
} from '../types/faq.types';
import { normalizeFaqQuestion } from '../utils/normalizeFaqQuestion';
import { similarity } from '../utils/levenshtein';
import {
  FAQ_SUGGESTIONS,
  FAQ_SUGGESTION_LEGACY_QUESTIONS,
  FaqSuggestionId,
  getFaqSuggestionsByIds,
} from '../data/faqSuggestions';

// Umbral de similitud para avisar (no bloquear) — 0.85 dejó pasar preguntas
// genuinamente distintas en las pruebas y agarró el caso real "tienne"/"tienen" (0.90).
const UMBRAL_SIMILITUD_AVISO = 0.85;

const buscarPreguntaParecida = async (botId: string, preguntaNormalizada: string, faqId?: string) => {
  const existentes = await prisma.faq.findMany({
    where: { botId, ...(faqId ? { id: { not: faqId } } : {}) },
    select: { id: true, pregunta: true, preguntaNormalizada: true },
  });

  let mejorCoincidencia: { id: string; pregunta: string; similitud: number } | null = null;

  for (const faq of existentes) {
    if (!faq.preguntaNormalizada) continue;
    const sim = similarity(preguntaNormalizada, faq.preguntaNormalizada);
    if (sim >= UMBRAL_SIMILITUD_AVISO && sim < 1 && (!mejorCoincidencia || sim > mejorCoincidencia.similitud)) {
      mejorCoincidencia = { id: faq.id, pregunta: faq.pregunta, similitud: Math.round(sim * 100) / 100 };
    }
  }

  return mejorCoincidencia;
};

const faqSelect = {
  id: true,
  botId: true,
  categoriaId: true,
  pregunta: true,
  respuesta: true,
  fechaCreacion: true,
  fechaModificacion: true,
  categoria: { select: { id: true, nombre: true } },
} satisfies Prisma.FaqSelect;
 
const obtenerBotDeUsuario = async (usuarioId: string) => {
  const bot = await prisma.configuracionBot.findUnique({ where: { usuarioId } });
  if (!bot) throw new Error('BOT_NOT_FOUND');
  return bot;
};

const verificarPreguntaDuplicada = async (botId: string, preguntaNormalizada: string, faqId?: string) => {
  const duplicada = await prisma.faq.findFirst({
    where: {
      botId,
      preguntaNormalizada,
      ...(faqId ? { id: { not: faqId } } : {}),
    },
    select: { id: true },
  });

  if (duplicada) throw new Error('FAQ_DUPLICATE');
};

const convertirErrorDeUnicidad = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    throw new Error('FAQ_DUPLICATE');
  }
  throw error;
};
 
export const crearFAQ = async (data: CreateFaqInput) => {
  const bot = await obtenerBotDeUsuario(data.usuarioId);
 
  const categoriaExiste = await prisma.categoriaFAQ.findFirst({
    where: { id: data.categoriaId, botId: bot.id }
  });
 
  if (!categoriaExiste) throw new Error('CATEGORY_NOT_FOUND');

  const pregunta = data.pregunta.trim();
  const preguntaNormalizada = normalizeFaqQuestion(pregunta);
  await verificarPreguntaDuplicada(bot.id, preguntaNormalizada);
  const posibleDuplicado = await buscarPreguntaParecida(bot.id, preguntaNormalizada);

  const nuevaFAQ = await prisma.faq.create({
    data: {
      botId: bot.id,
      categoriaId: data.categoriaId,
      pregunta,
      preguntaNormalizada,
      respuesta: data.respuesta.trim(),
      // Campo legado: todas las FAQ nuevas están disponibles para el chatbot.
      activa: true,
    },
    select: faqSelect,
  }).catch(convertirErrorDeUnicidad);
 
  await registrarActividad(
    data.usuarioId,
    'CREACION_FAQ',
    `El usuario creó la FAQ: "${nuevaFAQ.pregunta}"`,
    data.ip,
    data.dispositivo
  );
 
  return { ...nuevaFAQ, posibleDuplicado };
};

export const obtenerFAQs = async (usuarioId: string, filtros: GetFaqsInput) => {
  const bot = await obtenerBotDeUsuario(usuarioId);
 
  const { categoriaId, buscar, page, limit } = filtros;

  const where = {
    botId: bot.id,
    ...(categoriaId ? { categoriaId } : {}),
    ...(buscar && buscar.trim().length > 0
      ? {
          OR: [
            { pregunta: { contains: buscar.trim(), mode: 'insensitive' as const } },
            { respuesta: { contains: buscar.trim(), mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };
 
  const skip = (page - 1) * limit;
 
  const [faqs, total] = await prisma.$transaction([
    prisma.faq.findMany({
      where,
      select: faqSelect,
      orderBy: { fechaCreacion: 'desc' },
      skip,
      take: limit,
    }),
    prisma.faq.count({ where }),
  ]);
 
  return {
    faqs,
    total,
    page,
    limit,
    totalPaginas: Math.ceil(total / limit),
  };
};

export const actualizarFAQ = async (data: UpdateFaqInput) => {
  const bot = await obtenerBotDeUsuario(data.usuarioId);

  const faqExistente = await prisma.faq.findFirst({
    where: { id: data.faqId, botId: bot.id }
  });

  if (!faqExistente) throw new Error('FAQ_NOT_FOUND');

  if (data.categoriaId) {
    const categoriaExiste = await prisma.categoriaFAQ.findFirst({
      where: { id: data.categoriaId, botId: bot.id }
    });
    if (!categoriaExiste) throw new Error('CATEGORY_NOT_FOUND');
  }

  const pregunta = data.pregunta ? data.pregunta.trim() : faqExistente.pregunta;
  const preguntaNormalizada = data.pregunta
    ? normalizeFaqQuestion(pregunta)
    : faqExistente.preguntaNormalizada;
  if (preguntaNormalizada) await verificarPreguntaDuplicada(bot.id, preguntaNormalizada, data.faqId);
  const posibleDuplicado = data.pregunta && preguntaNormalizada
    ? await buscarPreguntaParecida(bot.id, preguntaNormalizada, data.faqId)
    : null;

  const faqActualizada = await prisma.faq.update({
    where: { id: data.faqId },
    data: {
      categoriaId: data.categoriaId || faqExistente.categoriaId,
      pregunta,
      preguntaNormalizada,
      respuesta: data.respuesta ? data.respuesta.trim() : faqExistente.respuesta,
      // Al editar una FAQ legada también queda disponible para el chatbot.
      activa: true,
    },
    select: faqSelect,
  }).catch(convertirErrorDeUnicidad);

  await registrarActividad(
    data.usuarioId,
    'EDICION_FAQ',
    `El usuario editó la FAQ a: "${faqActualizada.pregunta}"`,
    data.ip,
    data.dispositivo
  );

  return { ...faqActualizada, posibleDuplicado };
};

export const eliminarFAQ = async (data: DeleteFaqInput) => {
  const bot = await obtenerBotDeUsuario(data.usuarioId);

  const faqExistente = await prisma.faq.findFirst({
    where: { id: data.faqId, botId: bot.id }
  });

  if (!faqExistente) throw new Error('FAQ_NOT_FOUND');

  await prisma.faq.delete({ where: { id: data.faqId } });

  await registrarActividad(
    data.usuarioId,
    'ELIMINACION_FAQ',
    `El usuario eliminó la FAQ: "${faqExistente.pregunta}"`,
    data.ip,
    data.dispositivo
  );
};

export const obtenerSugerenciasFAQ = () => FAQ_SUGGESTIONS.map((suggestion) => ({
  id: suggestion.id,
  pregunta: suggestion.pregunta,
  respuesta: suggestion.respuesta,
  categoria: { nombre: suggestion.categoria },
}));

const isRetryableTransactionError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError
  && (error.code === 'P2002' || error.code === 'P2034');

export const crearFAQsDesdeSugerencias = async (data: CreateFaqsFromSuggestionsInput) => {
  const sugerencias = getFaqSuggestionsByIds(data.suggestionIds);
  if (!sugerencias) throw new Error('FAQ_SUGGESTION_NOT_FOUND');

  const crear = async () => prisma.$transaction(async (tx) => {
    const bot = await tx.configuracionBot.findUnique({ where: { usuarioId: data.usuarioId } });
    if (!bot) throw new Error('BOT_NOT_FOUND');

    const existentes = await tx.faq.findMany({
      where: { botId: bot.id },
      select: { pregunta: true, preguntaNormalizada: true },
    });
    const clavesExistentes = new Set(
      existentes
        .map((faq) => faq.preguntaNormalizada ?? normalizeFaqQuestion(faq.pregunta))
    );
    const creadas = [];

    for (const suggestion of sugerencias) {
      const plantilla = suggestion;
      const preguntaNormalizada = normalizeFaqQuestion(plantilla.pregunta);
      const preguntasEquivalentes = [
        plantilla.pregunta,
        ...(FAQ_SUGGESTION_LEGACY_QUESTIONS[plantilla.id as FaqSuggestionId] ?? []),
      ].map(normalizeFaqQuestion);
      if (preguntasEquivalentes.some((clave) => clavesExistentes.has(clave))) continue;

      let categoria = await tx.categoriaFAQ.findFirst({
        where: {
          botId: bot.id,
          nombre: { equals: plantilla.categoria, mode: 'insensitive' },
        },
      });

      if (!categoria) {
        categoria = await tx.categoriaFAQ.create({
          data: { botId: bot.id, nombre: plantilla.categoria },
        });
      }

      const faq = await tx.faq.create({
        data: {
          botId: bot.id,
          categoriaId: categoria.id,
          pregunta: plantilla.pregunta,
          preguntaNormalizada,
          respuesta: plantilla.respuesta,
          activa: true,
        },
        select: faqSelect,
      });
      creadas.push(faq);
      clavesExistentes.add(preguntaNormalizada);

      await tx.registroActividad.create({
        data: {
          usuarioId: data.usuarioId,
          accion: 'CREACION_FAQ',
          detalle: `El usuario creó la FAQ sugerida: "${faq.pregunta}"`,
          ip: data.ip,
          dispositivo: data.dispositivo,
        },
      });
    }

    return creadas;
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    timeout: 20000,
  });

  try {
    return await crear();
  } catch (error) {
    if (isRetryableTransactionError(error)) return crear();
    throw error;
  }
};