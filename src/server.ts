import dotenv from 'dotenv';

dotenv.config();

import app from './app';
import prisma from './lib/prisma';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await prisma.$connect();
    console.log('Conectado a la base de datos PostgreSQL (Neon) exitosamente.');

    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Servidor backend escuchando en puerto ${PORT}`);
      console.log(`Documentación disponible en /api-docs`);
    });
  } catch (error) {
    console.error('Error crítico al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();