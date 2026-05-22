const pool = require('../config/db');

const getAll = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre, email, negocio, created_at FROM emprendedor ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, nombre, email, negocio, created_at FROM emprendedor WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Emprendedor no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { nombre, email, password_hash, negocio } = req.body;
    if (!nombre || !email || !password_hash) {
      return res.status(400).json({ error: 'nombre, email y password_hash son requeridos' });
    }
    const result = await pool.query(
      'INSERT INTO emprendedor (nombre, email, password_hash, negocio) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, negocio, created_at',
      [nombre, email, password_hash, negocio]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'El email ya está registrado' });
    res.status(500).json({ error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, negocio } = req.body;
    const result = await pool.query(
      'UPDATE emprendedor SET nombre = COALESCE($1, nombre), negocio = COALESCE($2, negocio) WHERE id = $3 RETURNING id, nombre, email, negocio',
      [nombre, negocio, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Emprendedor no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAll, getById, create, update };
