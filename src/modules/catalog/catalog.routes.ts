import { Router } from 'express';
import { verificarToken, optionalToken } from '../../middlewares/auth.middleware';
import { getProductos, postProducto, getProducto } from './catalog.controller';

const router = Router();

/**
 * @swagger
 * /api/catalog/productos:
 *   get:
 *     tags: [Catalog]
 *     summary: Listar productos del emprendedor autenticado
 *     description: |
 *       **🔘 Botón UI: "Ver catálogo"** — se llama cuando el usuario toca este botón en el chat.
 *       Devuelve los productos activos para mostrarlos como opciones (Producto A, Producto B...).
 *
 *       **URLs de prueba (sin DB):**
 *       - Panadería García → `https://chatbot-innova-backend.onrender.com/api/catalog/productos?usuarioId=1`
 *       - Ferretería López → `https://chatbot-innova-backend.onrender.com/api/catalog/productos?usuarioId=2`
 *       - Ropa & Accesorios Mía → `https://chatbot-innova-backend.onrender.com/api/catalog/productos?usuarioId=3`
 *     parameters:
 *       - in: query
 *         name: usuarioId
 *         schema:
 *           type: integer
 *         description: ID del emprendedor (reemplaza al token para clientes anónimos). Probar con 1, 2 o 3.
 *         example: 1
 *     responses:
 *       200:
 *         description: Lista de productos activos
 *       400:
 *         description: usuarioId es requerido
 */
router.get('/productos', optionalToken, getProductos);

/**
 * @swagger
 * /api/catalog/productos:
 *   post:
 *     tags: [Catalog]
 *     summary: Crear un nuevo producto
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre]
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Torta de chocolate
 *               descripcion:
 *                 type: string
 *               precio:
 *                 type: number
 *                 example: 2500
 *               stock:
 *                 type: integer
 *               imagenUrl:
 *                 type: string
 *               activo:
 *                 type: boolean
 *                 default: true
 *                 description: Si es false el producto no aparece en el catálogo público
 *     responses:
 *       201:
 *         description: Producto creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 usuarioId:
 *                   type: integer
 *                 nombre:
 *                   type: string
 *                 descripcion:
 *                   type: string
 *                   nullable: true
 *                 precio:
 *                   type: number
 *                   nullable: true
 *                 stock:
 *                   type: integer
 *                   nullable: true
 *                 imagenUrl:
 *                   type: string
 *                   nullable: true
 *                 activo:
 *                   type: boolean
 *                 fechaCreacion:
 *                   type: string
 *                   format: date-time
 *                 fechaActualizacion:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: nombre es requerido
 */
router.post('/productos', verificarToken, postProducto);

/**
 * @swagger
 * /api/catalog/productos/{id}:
 *   get:
 *     tags: [Catalog]
 *     summary: Obtener un producto por ID
 *     description: >
 *       **🔘 Botón UI: "Producto A / B / C"** — se llama cuando el usuario selecciona un producto específico de la lista.
 *       Devuelve detalle completo: descripción, precio, stock e imagen.
 *       Desde esta pantalla el usuario puede tocar "Comprar ahora" (flujo de presupuesto) o "Ver otros productos".
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Producto encontrado
 *       404:
 *         description: Producto no encontrado
 */
router.get('/productos/:id', optionalToken, getProducto);

export default router;
