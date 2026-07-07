export interface CreateFaqInput {
  usuarioId: string;
  categoriaId: string;
  pregunta: string;
  respuesta: string;
  activa?: boolean;
  ip?: string;
  dispositivo?: string;
}

export interface UpdateFaqInput {
  usuarioId: string;
  faqId: string;
  categoriaId?: string;
  pregunta?: string;
  respuesta?: string;
  activa?: boolean;
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
  activa?: 'true' | 'false';
  buscar?: string;
  page: number;
  limit: number;
}