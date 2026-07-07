/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const rubrosPreestablecidos = [
    { nombre: 'Productos' },
    { nombre: 'Alimentos' },
    { nombre: 'Belleza' },
    { nombre: 'Servicios' },
    { nombre: 'Tecnologia' },
    { nombre: 'Hogar' },
    { nombre: 'Salud' },
    { nombre: 'Eventos' },
    { nombre: 'Artesanias' },
    { nombre: 'Retail' },
    { nombre: 'Otros' }
  ];

  console.log('Iniciando precarga de rubros...');
  
  for (const r of rubrosPreestablecidos) {
    await prisma.rubro.upsert({
      where: { nombre: r.nombre },
      update: {},
      create: { nombre: r.nombre },
    });
  }
  
  console.log('¡Rubros precargados con éxito!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });