const pool = require('../config/db');

const getByEmprendedor = async (req, res) => {
  try {
    const { id_emprendedor } = req.params;
    const result = await pool.query(
      'SELECT * FROM producto WHERE id_emprendedor = $1 AND activo = true ORDER BY nombre',
      [id_emprendedor]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { id_emprendedor, nombre, descripcion, precio, categoria, imagen_url } = req.body;
    if (!id_emprendedor || !nombre || precio === undefined) {
      return res.status(400).json({ error: 'id_emprendedor, nombre y precio son requeridos' });
    }
    const result = await pool.query(
      `INSERT INTO producto (id_emprendedor, nombre, descripcion, precio, categoria, imagen_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id_emprendedor, nombre, descripcion, precio, categoria, imagen_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, categoria, imagen_url, activo } = req.body;
    const result = await pool.query(
      `UPDATE producto SET
        nombre = COALESCE($1, nombre),
        descripcion = COALESCE($2, descripcion),
        precio = COALESCE($3, precio),
        categoria = COALESCE($4, categoria),
        imagen_url = COALESCE($5, imagen_url),
        activo = COALESCE($6, activo)
       WHERE id = $7 RETURNING *`,
      [nombre, descripcion, precio, categoria, imagen_url, activo, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE producto SET activo = false WHERE id = $1', [id]);
    res.json({ message: 'Producto desactivado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getByEmprendedor, create, update, remove };
