export interface CreateCategoryInput {
  usuarioId: string;
  nombre: string;
  ip?: string;
  dispositivo?: string;
}

export interface UpdateCategoryInput {
  usuarioId: string;
  categoriaId: string;
  nombre: string;
  ip?: string;
  dispositivo?: string;
}

export interface DeleteCategoryInput {
  usuarioId: string;
  categoriaId: string;
  ip?: string;
  dispositivo?: string;
}
