export interface RegisterInput {
  nombre: string;
  email: string;
  password?: string;
  nombreNegocio?: string;
}

export interface LoginInput {
  email: string;
  password?: string;
  ip?: string;
  dispositivo?: string;
}

export interface AuthResult {
  token: string;
  usuario: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
  };
}