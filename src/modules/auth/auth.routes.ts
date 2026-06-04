import { Router } from 'express';
import { register, login } from './auth.controller';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Registrar un nuevo emprendedor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, email, password]
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: María García
 *               email:
 *                 type: string
 *                 example: maria@negocio.com
 *               password:
 *                 type: string
 *                 example: MiPassword123
 *               telefono:
 *                 type: string
 *                 example: "+5491112345678"
 *               rol:
 *                 type: string
 *                 example: emprendedor
 *                 description: "Default: emprendedor"
 *               estado:
 *                 type: string
 *                 example: activo
 *                 description: "Default: activo"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 nombre:
 *                   type: string
 *                 email:
 *                   type: string
 *                 rol:
 *                   type: string
 *                 telefono:
 *                   type: string
 *                 estado:
 *                   type: string
 *                 fechaRegistro:
 *                   type: string
 *                   format: date-time
 *                 ultimaSesion:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *       409:
 *         description: El email ya está registrado
 *       400:
 *         description: Campos requeridos faltantes
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Iniciar sesión
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: maria@negocio.com
 *               password:
 *                 type: string
 *                 example: MiPassword123
 *     responses:
 *       200:
 *         description: Login exitoso, devuelve token JWT
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', login);

export default router;
