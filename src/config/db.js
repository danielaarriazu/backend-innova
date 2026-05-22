const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // requerido por Supabase
});

pool.on('connect', () => {
  console.log('Conectado a PostgreSQL (Supabase)');
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err);
  process.exit(1);
});

module.exports = pool;
