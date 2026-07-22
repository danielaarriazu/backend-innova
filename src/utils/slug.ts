import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

export function generarSlug(texto: string): string {
  const slug = texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return slug || 'negocio';
}

export async function generarSlugUnico(textoBase: string): Promise<string> {
  const slugBase = generarSlug(textoBase);
  let candidato = slugBase;
  let sufijo = 2;

  while (await prisma.configuracionBot.findUnique({
    where: { slug: candidato },
    select: { id: true },
  })) {
    candidato = `${slugBase}-${sufijo}`;
    sufijo += 1;
  }

  return candidato;
}

export function esConflictoSlug(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return false;
  }

  const target = error.meta?.target;
  return Array.isArray(target)
    ? target.some((field) => field === 'slug')
    : typeof target === 'string' && target.includes('slug');
}
