export const INVALID_QUESTION_MESSAGE =
  'La pregunta debe estar escrita con palabras reales, no una combinación de números y letras al azar.';

export const INVALID_ANSWER_MESSAGE =
  'La respuesta debe estar escrita con palabras reales, no una combinación de números y letras al azar.';

const LETRA = /\p{L}/u;

/**
 * Heurística liviana (no NLP) para descartar entradas tipo "2153454ws5erwe":
 * exige al menos dos "palabras" separadas por espacio, cada una con 2+ letras
 * reales, y que los dígitos no dominen el texto. No detecta si el contenido
 * tiene sentido — solo si tiene *forma* de pregunta/oración.
 */
export function pareceUnaPreguntaReal(texto: string): boolean {
  const limpio = texto.trim();
  if (limpio.length === 0) return false;

  const palabras = limpio.split(/\s+/);
  const palabrasConLetras = palabras.filter((palabra) => {
    const letras = [...palabra].filter((caracter) => LETRA.test(caracter));
    return letras.length >= 2;
  });

  if (palabrasConLetras.length < 2) return false;

  const totalCaracteres = limpio.replace(/\s+/g, '').length;
  const totalDigitos = (limpio.match(/\d/g) ?? []).length;
  if (totalDigitos / totalCaracteres > 0.2) return false;

  return true;
}

/**
 * Versión pensada para respuestas: a diferencia de la pregunta, una respuesta
 * real puede ser legítimamente corta o puramente numérica ("Sí", "$15000",
 * "24hs"), así que NO exige un mínimo de palabras. Solo rechaza el patrón que
 * realmente delata texto aleatorio: un único token sin espacios, de 8+
 * caracteres, que mezcla letras y dígitos sin ninguna estructura (ej.
 * "35345y062Inhk"). Cualquier texto con al menos un espacio se deja pasar tal
 * cual — ya tiene forma de frase.
 */
export function pareceRespuestaValida(texto: string): boolean {
  const limpio = texto.trim();
  if (limpio.length === 0) return false;
  if (/\s/.test(limpio)) return true;
  if (limpio.length < 8) return true;

  const letras = (limpio.match(new RegExp(LETRA, 'gu')) ?? []).length;
  const digitos = (limpio.match(/\d/g) ?? []).length;
  if (letras >= 2 && digitos >= 2) return false;

  return true;
}