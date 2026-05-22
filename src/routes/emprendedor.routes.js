const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/emprendedor.controller');

/**
 * @swagger
 * /api/emprendedores:
 *   get:
 *     tags: [Emprendedores]
 *     summary: Lista todos los emprendedores registrados
 *     responses:
 *       200:
 *         description: Lista de emprendedores (sin contraseña)
 *         content:
 *           application/json:
 *             example:
 *               - id: 1
 *                 nombre: "María García"
 *                 email: "maria@panaderia.com"
 *                 negocio: "Panadería La Estrella"
 *                 created_at: "2025-05-22T10:00:00Z"
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/emprendedores:
 *   post:
 *     tags: [Emprendedores]
 *     summary: Registra un nuevo emprendedor
 *     description: Crea el perfil del negocio que usará el chatbot. El password_hash debe llegar ya encriptado (bcrypt). La autenticación completa se implementa en Sprint 3.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, email, password_hash]
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "María García"
 *               email:
 *                 type: string
 *                 example: "maria@panaderia.com"
 *               password_hash:
 *                 type: string
 *                 example: "$2b$10$hasheado..."
 *               negocio:
 *                 type: string
 *                 example: "Panadería La Estrella"
 *     responses:
 *       201:
 *         description: Emprendedor creado
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *               nombre: "María García"
 *               email: "maria@panaderia.com"
 *               negocio: "Panadería La Estrella"
 *       400:
 *         description: Faltan campos obligatorios
 *       409:
 *         description: El email ya está registrado
 */
router.post('/', ctrl.create);

router.get('/:id', ctrl.getById);
router.put('/:id', ctrl.update);

module.exports = router;
