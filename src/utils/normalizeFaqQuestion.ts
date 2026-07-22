export const DUPLICATE_FAQ_MESSAGE = 'Ya existe una pregunta frecuente similar.';

export const normalizeFaqQuestion = (value: string): string => value
  .trim()
  .toLocaleLowerCase('es-AR')
  .normalize('NFD')
  .replace(/\p{M}+/gu, '')
  .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .split(' ')
  .filter(Boolean)
  .sort()
  .join(' ');
