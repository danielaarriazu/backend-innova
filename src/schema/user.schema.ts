import { z } from 'zod';
import { passwordSchema } from './password.schema';

export const changePasswordSchema = z.object({
  passwordActual: z
    .string({ error: 'La contraseña actual es obligatoria' })
    .min(1, {error: 'La contraseña actual es obligatoria'}),

  nuevaPassword: passwordSchema,
}).refine(
  (data) => data.passwordActual !== data.nuevaPassword,
  {
    message: 'La nueva contraseña no puede ser igual a la actual',
    path: ['nuevaPassword'],
  }
);

export const deleteAccountSchema = z.object({
  password: z
    .string({ error: 'La contraseña es obligatoria para eliminar la cuenta' })
    .min(1, {error: 'La contraseña es obligatoria para eliminar la cuenta'}),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;