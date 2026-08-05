import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  FAQ_SUGGESTIONS,
  FAQ_SUGGESTION_LEGACY_QUESTIONS,
  getFaqSuggestionsByIds,
} from '../src/data/faqSuggestions';
import { normalizeFaqQuestion } from '../src/utils/normalizeFaqQuestion';

const expectedSuggestions = [
  {
    id: 'medios-pago',
    pregunta: '¿Qué medios de pago aceptan?',
    respuesta: 'Aceptamos transferencias bancarias, tarjetas de crédito y débito a través de MercadoPago.',
    categoria: 'Precios y pagos',
  },
  {
    id: 'envios',
    pregunta: '¿Realizan envíos?',
    respuesta: 'Sí, realizamos envíos a todo el país.',
    categoria: 'Envíos',
  } ,
  {
    id: 'stock-disponible',
    pregunta: '¿Tienen stock disponible?',
    respuesta: 'Sí, contamos con stock disponible para todos nuestros productos.',
    categoria: 'Productos y stock',
  },
  {
    id: 'ventas-mayor',
    pregunta: '¿Realizan ventas por mayor?',
    respuesta: 'Sí, ofrecemos precios especiales para compras por mayor.',
    categoria: 'Proceso de compra',
  },
  {
    id: 'cambios-devoluciones',
    pregunta: '¿Aceptan cambios o devoluciones?',
    respuesta: 'Sí, aceptamos cambios y devoluciones dentro de los primeros 30 días de recibido el producto.',
    categoria: 'Cambios y devoluciones',
  },
];

test('el catálogo contiene exactamente las seis sugerencias aprobadas por UX', () => {
  assert.deepEqual(FAQ_SUGGESTIONS, expectedSuggestions);
  assert.equal(FAQ_SUGGESTIONS.some(({ pregunta }) => pregunta.includes('garantía')), false);
});

test('los IDs del catálogo son estables y únicos', () => {
  const ids = FAQ_SUGGESTIONS.map(({ id }) => id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((id) => /^[a-z0-9-]+$/.test(id)));
});

test('solo resuelve IDs oficiales y elimina IDs repetidos', () => {
  assert.equal(getFaqSuggestionsByIds(['inexistente']), null);
  assert.deepEqual(
    getFaqSuggestionsByIds(['envios', 'envios'])?.map(({ id }) => id),
    ['envios'],
  );
});

test('conserva alias técnicos para no duplicar las plantillas automáticas antiguas', () => {
  assert.deepEqual(FAQ_SUGGESTION_LEGACY_QUESTIONS, {
    'medios-pago': ['¿Cuáles son los medios de pago?'],
    'ventas-mayor': ['¿Hacen precio por mayor?'],
  });
});

test('la normalización detecta equivalencias de tildes, signos, espacios y orden', () => {
  assert.equal(
    normalizeFaqQuestion('  ¿Qué medios de pago aceptan? '),
    normalizeFaqQuestion('ACEPTAN medios de PAGO, que'),
  );
});

test('el registro no crea categorías ni FAQ automáticas', () => {
  const authService = readFileSync(
    new URL('../src/services/auth.service.ts', import.meta.url),
    'utf8',
  );

  assert.doesNotMatch(authService, /categoriaFAQ|normalizeFaqQuestion|faqs:\s*\{\s*create/);
});
