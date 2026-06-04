import { Router } from 'express';
import { verificarToken, optionalToken } from '../../middlewares/auth.middleware';
import { getProductos, postProducto, getProducto } from './catalog.controller';

const router = Router();

/**
 * @swagger
 * /api/catalog/productos:
 *   get:
 *     tags: [Catalog]
 *     summary: Listar productos del emprendedor
 *     description: |
 *       **🔘 Botón UI: "Ver catálogo"** — se llama cuando el usuario toca este botón en el chat.
 *       Devuelve los productos activos para mostrarlos como opciones (Producto A, Producto B...).
 *
 *       **Emprendedores de prueba:**
 *       - `1` → Panadería García (4 productos)
 *       - `2` → Ferretería López (5 productos)
 *       - `3` → Ropa & Accesorios Mía (4 productos)
 *     parameters:
 *       - in: query
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: integer
 *           enum: [1, 2, 3]
 *           example: 1
 *         description: "ID del emprendedor dueño del chatbot. 1=Panadería García | 2=Ferretería López | 3=Ropa & Accesorios Mía"
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
 *     description: |
 *       **🔘 Botón UI: "Producto A / B / C"** — se llama cuando el usuario selecciona un producto específico de la lista.
 *       Devuelve detalle completo: descripción, precio, stock e imagen.
 *
 *       **IDs de prueba por emprendedor:**
 *       - Panadería García → `101` Torta de chocolate · `102` Medialunas x12 · `103` Pan de campo · `104` Facturas x6
 *       - Ferretería López → `201` Pintura látex · `202` Taladro percutor · `203` Cinta métrica · `204` Set tornillos · `205` Llave inglesa
 *       - Ropa & Accesorios Mía → `301` Remera básica · `302` Vestido floral · `303` Zapatillas urbanas · `304` Cartera cuero eco
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           enum: [101, 102, 103, 104, 201, 202, 203, 204, 205, 301, 302, 303, 304]
 *           example: 101
 *         description: "ID del producto. Panadería: 101-104 | Ferretería: 201-205 | Ropa: 301-304"
 *     responses:
 *       200:
 *         description: Producto encontrado
 *       404:
 *         description: Producto no encontrado
 */
router.get('/productos/:id', optionalToken, getProducto);

export default router;
