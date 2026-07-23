import type { registerSchema, loginSchema, googleLoginSchema } from '../schema/auth.schema';
import { z } from 'zod';

// Se eliminó el "& {}" vacío que era innecesario
export type RegisterInput = z.infer<typeof registerSchema>;

export type LoginInput = z.infer<typeof loginSchema> & {
  ip?: string;
  dispositivo?: string;
};

export type GoogleLoginInput = z.infer<typeof googleLoginSchema> & {
  ip?: string;
  dispositivo?: string;
};

export interface AuthResult {
  token: string;
  usuario: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
  };
}
