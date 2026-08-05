/** 
 * Validacion de strings, para detectar similitudes y errores tipográficos.
 * Distancia de Levenshtein: cantidad mínima de inserciones/borrados/reemplazos
 * de un carácter para convertir `a` en `b`.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let filaAnterior = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    const filaActual = [i];
    for (let j = 1; j <= b.length; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      filaActual.push(
        Math.min(
          filaActual[j - 1] + 1, // inserción
          filaAnterior[j] + 1, // borrado
          filaAnterior[j - 1] + costo, // reemplazo
        ),
      );
    }
    filaAnterior = filaActual;
  }

  return filaAnterior[b.length];
}

/**
 * Similitud entre 0 (nada que ver) y 1 (idénticos), pensada para strings ya
 * normalizados (ver normalizeFaqQuestion). No es apta como única fuente de
 * verdad para bloquear nada — es una señal para avisar, no para prohibir.
 */
export function similarity(a: string, b: string): number {
  const largoMaximo = Math.max(a.length, b.length);
  if (largoMaximo === 0) return 1;
  return 1 - levenshteinDistance(a, b) / largoMaximo;
}