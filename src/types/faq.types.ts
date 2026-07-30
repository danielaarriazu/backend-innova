export interface CreateFaqInput {
  usuarioId: string;
  categoriaId: string;
  pregunta: string;
  respuesta: string;
  ip?: string;
  dispositivo?: string;
}

export interface UpdateFaqInput {
  usuarioId: string;
  faqId: string;
  categoriaId?: string;
  pregunta?: string;
  respuesta?: string;
  ip?: string;
  dispositivo?: string;
}

export interface DeleteFaqInput {
  usuarioId: string;
  faqId: string;
  ip?: string;
  dispositivo?: string;
}

export interface GetFaqsInput {
  categoriaId?: string;
  buscar?: string;
  page: number;
  limit: number;
}

export interface CreateFaqsFromSuggestionsInput {
  usuarioId: string;
  suggestionIds: string[];
  ip?: string;
  dispositivo?: string;
}
