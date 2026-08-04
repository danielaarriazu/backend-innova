export interface FaqSuggestion {
  id: string;
  pregunta: string;
  respuesta: string;
  categoria: string;
}

export const FAQ_SUGGESTIONS = [
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
  },
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
] as const satisfies readonly FaqSuggestion[];

export type FaqSuggestionId = (typeof FAQ_SUGGESTIONS)[number]['id'];

export const FAQ_SUGGESTION_LEGACY_QUESTIONS: Partial<Record<FaqSuggestionId, readonly string[]>> = {
  'medios-pago': ['¿Cuáles son los medios de pago?'],
  'ventas-mayor': ['¿Hacen precio por mayor?'],
};

export const getFaqSuggestionsByIds = (ids: readonly string[]): FaqSuggestion[] | null => {
  const suggestions = [...new Set(ids)].map((id) => FAQ_SUGGESTIONS.find((item) => item.id === id));
  if (suggestions.some((suggestion) => !suggestion)) return null;
  return suggestions as FaqSuggestion[];
};
