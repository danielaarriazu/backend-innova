import assert from 'node:assert/strict';
import test from 'node:test';
import { levenshteinDistance, similarity } from '../src/utils/levenshtein';
import { pareceRespuestaValida, pareceUnaPreguntaReal } from '../src/utils/pareceUnaPreguntaReal';
import { normalizeFaqQuestion } from '../src/utils/normalizeFaqQuestion';

test('levenshteinDistance: casos base', () => {
  assert.equal(levenshteinDistance('', ''), 0);
  assert.equal(levenshteinDistance('a', ''), 1);
  assert.equal(levenshteinDistance('', 'abc'), 3);
  assert.equal(levenshteinDistance('gato', 'gato'), 0);
  assert.equal(levenshteinDistance('gato', 'pato'), 1);
});

test('similarity: el caso real de la captura (tienne / tienen) supera el umbral de aviso', () => {
  const a = normalizeFaqQuestion('de que sabores tienne');
  const b = normalizeFaqQuestion('de que sabores tienen');
  assert.ok(similarity(a, b) >= 0.85);
});

test('similarity: preguntas genuinamente distintas quedan lejos del umbral', () => {
  const a = normalizeFaqQuestion('cuales son los medios de pago');
  const b = normalizeFaqQuestion('hacen envios a todo el pais');
  assert.ok(similarity(a, b) < 0.85);
});

test('similarity: strings idénticos dan 1', () => {
  assert.equal(similarity('hola', 'hola'), 1);
});

test('pareceUnaPreguntaReal: rechaza combinaciones de caracteres al azar', () => {
  assert.equal(pareceUnaPreguntaReal('2153454ws5erwe'), false);
  assert.equal(pareceUnaPreguntaReal('35345y062Inhk'), false);
  assert.equal(pareceUnaPreguntaReal('asd'), false);
  assert.equal(pareceUnaPreguntaReal(''), false);
  assert.equal(pareceUnaPreguntaReal('   '), false);
});

test('pareceUnaPreguntaReal: acepta preguntas reales, incluso con números legítimos', () => {
  assert.equal(pareceUnaPreguntaReal('¿de que sabores tienen?'), true);
  assert.equal(pareceUnaPreguntaReal('¿tienen talles del 38 al 44?'), true);
  assert.equal(pareceUnaPreguntaReal('¿hacen envíos a todo el país?'), true);
});

test('pareceRespuestaValida: rechaza el mismo tipo de basura que llegó a producción', () => {
  assert.equal(pareceRespuestaValida('35345y062Inhk'), false);
  assert.equal(pareceRespuestaValida('2153454ws5erwe'), false);
});

test('pareceRespuestaValida: NO exige varias palabras — deja pasar respuestas cortas legítimas', () => {
  assert.equal(pareceRespuestaValida('Sí'), true);
  assert.equal(pareceRespuestaValida('No'), true);
  assert.equal(pareceRespuestaValida('$15000'), true);
  assert.equal(pareceRespuestaValida('24hs'), true);
});

test('pareceRespuestaValida: cualquier texto con espacios se deja pasar tal cual', () => {
  assert.equal(pareceRespuestaValida('Todos los que quieras'), true);
  assert.equal(pareceRespuestaValida('Sí, enviamos a todo el país'), true);
});