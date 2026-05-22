const pool = require('../config/db');
const { procesarMensaje } = require('./chatbot.service');
const { procesarMensajeKeyword } = require('./keywords.service');

// POST /api/chatbot/iniciar
// Crea una nueva consulta y devuelve el mensaje de bienvenida
const iniciarConversacion = async (req, res) => {
  try {
    const { id_emprendedor, canal } = req.body;
    if (!id_emprendedor) return res.status(400).json({ error: 'id_emprendedor es requerido' });

    const r = await pool.query(
      `INSERT INTO consulta (id_emprendedor, canal, estado, paso_actual)
       VALUES ($1, $2, 'abierta', 'BIENVENIDA') RETURNING id`,
      [id_emprendedor, canal || 'web']
    );
    const id_consulta = r.rows[0].id;

    // Disparar el primer mensaje (bienvenida) con un texto vacío
    const resultado = await procesarMensaje(id_consulta, '');

    res.status(201).json({ id_consulta, ...resultado });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/chatbot/mensaje
// Procesa un mensaje del usuario dentro de una consulta existente
const enviarMensaje = async (req, res) => {
  try {
    const { id_consulta, texto } = req.body;
    if (!id_consulta || !texto) {
      return res.status(400).json({ error: 'id_consulta y texto son requeridos' });
    }

    const resultado = await procesarMensaje(id_consulta, texto);
    res.json(resultado);
  } catch (err) {
    if (err.message === 'Consulta no encontrada') return res.status(404).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
};

// GET /api/chatbot/historial/:id_consulta
// Devuelve todos los mensajes de una consulta
const obtenerHistorial = async (req, res) => {
  try {
    const { id_consulta } = req.params;
    const r = await pool.query(
      'SELECT origen, contenido, created_at FROM mensaje WHERE id_consulta = $1 ORDER BY created_at ASC',
      [id_consulta]
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/chatbot/chat
// Motor de palabras clave — sin base de datos, respuestas hardcodeadas
const chat = (req, res) => {
  try {
    const { mensaje, sessionId } = req.body;
    if (!mensaje) return res.status(400).json({ error: 'mensaje es requerido' });

    const sid = sessionId || `anon-${Date.now()}`;
    const resultado = procesarMensajeKeyword(sid, mensaje);
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { iniciarConversacion, enviarMensaje, obtenerHistorial, chat };
