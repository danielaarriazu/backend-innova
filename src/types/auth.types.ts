import type { registerSchema, loginSchema } from '../schema/auth.schema';
import type { z } from 'zod';

export type RegisterInput = z.infer<typeof registerSchema> & {
  
}

export type LoginInput = z.infer<typeof loginSchema> &  {
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