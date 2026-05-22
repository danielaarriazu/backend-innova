const pool = require('../config/db');

const getByEmprendedor = async (req, res) => {
  try {
    const { id_emprendedor } = req.params;
    const result = await pool.query(
      'SELECT * FROM cliente WHERE id_emprendedor = $1 ORDER BY created_at DESC',
      [id_emprendedor]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Crea o devuelve un cliente existente (upsert por telefono + id_emprendedor)
const createOrGet = async (req, res) => {
  try {
    const { id_emprendedor, nombre, telefono, email } = req.body;
    if (!id_emprendedor || !telefono) {
      return res.status(400).json({ error: 'id_emprendedor y telefono son requeridos' });
    }

    const existing = await pool.query(
      'SELECT * FROM cliente WHERE id_emprendedor = $1 AND telefono = $2',
      [id_emprendedor, telefono]
    );
    if (existing.rows.length > 0) return res.json(existing.rows[0]);

    const result = await pool.query(
      'INSERT INTO cliente (id_emprendedor, nombre, telefono, email) VALUES ($1, $2, $3, $4) RETURNING *',
      [id_emprendedor, nombre, telefono, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getByEmprendedor, createOrGet };
