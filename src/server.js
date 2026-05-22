require('dotenv').config();
const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 3000;

async function start() {
  // Intenta conectar a la DB, pero no bloquea el arranque si falla
  try {
    await pool.query('SELECT 1');
    console.log('✅ Conexión a la base de datos OK');
  } catch (err) {
    console.warn('⚠️  Sin conexión a la base de datos:', err.message);
    console.warn('   Los endpoints del chatbot de keywords y Swagger siguen funcionando.');
    console.warn('   Configurá DATABASE_URL en el archivo .env para activar el resto.');
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📋 Swagger UI:        http://localhost:${PORT}/api-docs`);
    console.log(`🤖 Chat de prueba:    POST http://localhost:${PORT}/api/chatbot/chat\n`);
  });
}

start();
