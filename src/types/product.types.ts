export interface CreateProductInput {
  usuarioId: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock?: number;
  urlImagen?: string;
  activo?: boolean;
  ip?: string;
  dispositivo?: string;
}

export interface UpdateProductInput {
  usuarioId: string;
  productoId: string;
  nombre?: string;
  descripcion?: string;
  precio?: number;
  stock?: number;
  urlImagen?: string;
  activo?: boolean;
  ip?: string;
  dispositivo?: string;
}

export interface DeleteProductInput {
  usuarioId: string;
  productoId: string;
  ip?: string;
  dispositivo?: string;
}

export interface GetProductsInput {
  buscar?: string;
  activo?: 'true' | 'false';
  page: number;
  limit: number;
}