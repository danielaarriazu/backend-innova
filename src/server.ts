import dotenv from 'dotenv';

dotenv.config();

import app from './app';
import prisma from './db';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await prisma.$connect();
    console.log('Conectado a la base de datos PostgreSQL (Neon) exitosamente.');

    // 2. Encendemos el servidor web
    app.listen(PORT, () => {
      console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
      console.log(`Documentación disponible en http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Error crítico al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();