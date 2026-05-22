const pool = require('../config/db');

const getByConsulta = async (req, res) => {
  try {
    const { id_consulta } = req.params;
    const result = await pool.query(
      'SELECT * FROM mensaje WHERE id_consulta = $1 ORDER BY created_at ASC',
      [id_consulta]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { id_consulta, origen, contenido } = req.body;
    // origen: 'cliente' | 'bot' | 'humano'
    if (!id_consulta || !origen || !contenido) {
      return res.status(400).json({ error: 'id_consulta, origen y contenido son requeridos' });
    }
    const valid = ['cliente', 'bot', 'humano'];
    if (!valid.includes(origen)) {
      return res.status(400).json({ error: `origen debe ser uno de: ${valid.join(', ')}` });
    }
    const result = await pool.query(
      'INSERT INTO mensaje (id_consulta, origen, contenido) VALUES ($1, $2, $3) RETURNING *',
      [id_consulta, origen, contenido]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getByConsulta, create };
