import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient, EstadoUsuario } from '@prisma/client';


const prisma = new PrismaClient();

// Expresión regular estricta para contraseñas (8 caracteres, Mayús, Minús, Número y Caracter Especial)
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,}$/;

//  CAMBIAR CONTRASEÑA
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { passwordActual, nuevaPassword } = req.body;
    
    // El id del usuario vendrá inyectado por el middleware de token en req.usuario
    const usuarioId = (req as any).usuario?.id; 

    if (!usuarioId) {
      res.status(401).json({ message: 'No autorizado. Falta el contexto de usuario.' });
      return;
    }

    // Buscamos al usuario en la base de datos
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario || usuario.estado === EstadoUsuario.ELIMINADO) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    // Verificar si la contraseña actual que ingresó es correcta
    const passwordValida = await bcrypt.compare(passwordActual, usuario.password);
    if (!passwordValida) {
      res.status(400).json({ message: 'La contraseña actual es incorrecta' });
      return;
    }

    // Validar el nivel de seguridad de la nueva contraseña
    if (!PASSWORD_REGEX.test(nuevaPassword)) {
      res.status(400).json({ 
        message: 'La nueva contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.' 
      });
      return;
    }

    // Hashear la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(nuevaPassword, salt);

    // Guardar el cambio en PostgreSQL
    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Contraseña actualizada con éxito' });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor al cambiar la contraseña' });
  }
};

// FALSO ELIMINAR 
export const DeleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = (req as any).usuario?.id;

    if (!usuarioId) {
      res.status(401).json({ message: 'No autorizado' });
      return;
    }

    // En lugar de usar delete(), actualizamos su estado al enum ELIMINADO
    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { estado: EstadoUsuario.ELIMINADO }
    });

    res.json({ message: 'La cuenta se ha dado de baja exitosamente.' });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor al procesar la baja de la cuenta' });
  }
};