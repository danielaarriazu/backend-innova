export interface CreateFaqInput {
  usuarioId: string;
  categoriaId: string;
  pregunta: string;
  respuesta: string;
  keywords?: string;
  ip?: string;
  dispositivo?: string;
}

export interface UpdateFaqInput {
  usuarioId: string;
  faqId: string;
  categoriaId?: string;
  pregunta?: string;
  respuesta?: string;
  keywords?: string;
  ip?: string;
  dispositivo?: string;
}

export interface DeleteFaqInput {
  usuarioId: string;
  faqId: string;
  ip?: string;
  dispositivo?: string;
}