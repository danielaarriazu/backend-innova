/**
 * Regla de contraseña compartida como Zod refinement.
 * Se importa en cualquier schema que necesite validar passwords.
 */
import { z } from 'zod';
 
export const passwordSchema = z
  .string({ error: 'La contraseña es obligatoria' })
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(100, 'La contraseña no puede superar los 100 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')
  .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un símbolo (@, $, !, %, *, ?, &, etc.)')
  .regex(/^\S+$/, 'No puede contener espacios en blanco');