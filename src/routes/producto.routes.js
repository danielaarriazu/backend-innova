const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/producto.controller');

/**
 * @swagger
 * /api/productos/emprendedor/{id_emprendedor}:
 *   get:
 *     tags: [Productos]
 *     summary: Lista el catálogo activo de un negocio
 *     description: Devuelve todos los productos activos del emprendedor, ordenados por nombre. El chatbot usa este endpoint para mostrar el catálogo al cliente.
 *     parameters:
 *       - in: path
 *         name: id_emprendedor
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Lista de productos
 *         content:
 *           application/json:
 *             example:
 *               - id: 3
 *                 nombre: "Medialunas x12"
 *                 descripcion: "Medialunas de manteca, horneadas el día"
 *                 precio: "350.00"
 *                 categoria: "Panadería"
 *                 imagen_url: null
 *                 activo: true
 */
router.get('/emprendedor/:id_emprendedor', ctrl.getByEmprendedor);

router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
