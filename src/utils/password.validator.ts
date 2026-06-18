import PasswordValidator from 'password-validator';

export const passwordSchema = new PasswordValidator();

// Configuramos las reglas 
passwordSchema
  .is().min(8)           // Mínimo 8 caracteres
  .is().max(100)         // Máximo 100 caracteres (buena práctica de seguridad contra ataques de saturación)
  .has().uppercase()     // Al menos una letra mayúscula
  .has().lowercase()     // Al menos una letra minúscula
  .has().digits(1)       // Al menos un número
  .has().symbols(1)      // Al menos un símbolo (Cualquiera: #, $, %, +, _, etc.)
  .has().not().spaces(); // Estrictamente sin espacios en blanco