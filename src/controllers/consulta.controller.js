const pool = require('../config/db');

const getByEmprendedor = async (req, res) => {
  try {
    const { id_emprendedor } = req.params;
    const result = await pool.query(
      `SELECT c.*, cl.nombre as nombre_cliente, cl.telefono
       FROM consulta c
       LEFT JOIN cliente cl ON c.id_cliente = cl.id
       WHERE c.id_emprendedor = $1
       ORDER BY c.created_at DESC`,
      [id_emprendedor]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { id_emprendedor, id_cliente, canal } = req.body;
    if (!id_emprendedor) {
      return res.status(400).json({ error: 'id_emprendedor es requerido' });
    }
    const result = await pool.query(
      `INSERT INTO consulta (id_emprendedor, id_cliente, canal, estado)
       VALUES ($1, $2, $3, 'abierta') RETURNING *`,
      [id_emprendedor, id_cliente, canal || 'web']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body; // 'abierta' | 'derivada' | 'cerrada'
    const valid = ['abierta', 'derivada', 'cerrada'];
    if (!valid.includes(estado)) {
      return res.status(400).json({ error: `estado debe ser uno de: ${valid.join(', ')}` });
    }
    const result = await pool.query(
      'UPDATE consulta SET estado = $1 WHERE id = $2 RETURNING *',
      [estado, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Consulta no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getByEmprendedor, create, updateEstado };
