// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Buscando sesiones sin sessionId...');
  
  const sesionesVacias = await prisma.sesionChat.findMany({
    where: {
      sessionId: null,
    },
  });

  console.log(`Se encontraron ${sesionesVacias.length} sesiones para actualizar.`);

  for (const sesion of sesionesVacias) {
    await prisma.sesionChat.update({
      where: { id: sesion.id },
      data: { sessionId: crypto.randomUUID() },
    });
  }

  console.log('¡Todas las sesiones fueron actualizadas con éxito!');
}

main()
  .catch((e) => {
    console.error('Error durante la actualización:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });