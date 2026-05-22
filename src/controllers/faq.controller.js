const pool = require('../config/db');

const getByEmprendedor = async (req, res) => {
  try {
    const { id_emprendedor } = req.params;
    const result = await pool.query(
      'SELECT * FROM faq WHERE id_emprendedor = $1 AND activo = true ORDER BY categoria, pregunta',
      [id_emprendedor]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { id_emprendedor, pregunta, respuesta, categoria } = req.body;
    if (!id_emprendedor || !pregunta || !respuesta) {
      return res.status(400).json({ error: 'id_emprendedor, pregunta y respuesta son requeridos' });
    }
    const result = await pool.query(
      'INSERT INTO faq (id_emprendedor, pregunta, respuesta, categoria) VALUES ($1, $2, $3, $4) RETURNING *',
      [id_emprendedor, pregunta, respuesta, categoria]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { pregunta, respuesta, categoria, activo } = req.body;
    const result = await pool.query(
      `UPDATE faq SET
        pregunta = COALESCE($1, pregunta),
        respuesta = COALESCE($2, respuesta),
        categoria = COALESCE($3, categoria),
        activo = COALESCE($4, activo)
       WHERE id = $5 RETURNING *`,
      [pregunta, respuesta, categoria, activo, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'FAQ no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getByEmprendedor, create, update };
