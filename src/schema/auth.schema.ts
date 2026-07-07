import { z } from 'zod';
import { passwordSchema } from './password.schema';

export const registerSchema = z.object({
  nombre: z
    .string({ error: 'El nombre es obligatorio' })
    .trim()
    .min(1, { error: 'El nombre no puede estar vacío' })
    .max(100, { error: 'El nombre no puede superar los 100 caracteres' }),

  email: z.email({
    error: (issue) => 
      issue.input === undefined
        ? 'El email es obligatorio'
        : 'El formato del correo electrónico no es válido'
  }).toLowerCase(),
  
  password: passwordSchema,

  nombreNegocio: z.string().trim().max(150).optional(),

});

export const loginSchema = z.object({
 email: z.email({
  error: (issue) => 
    issue.input === undefined
      ? 'El email es obligatorio'
      : 'El formato del correo electrónico no es válido'
}).toLowerCase(),

  password: z
    .string({ error: 'La contraseña es obligatoria' })
    .min(1, { error: 'La contraseña es obligatoria' }),
});


export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;