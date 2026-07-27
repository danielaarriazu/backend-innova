// update-slugs.ts
import prisma from '../src/lib/prisma';
import { generarSlug } from '../src/utils/slug';

async function poblarSlugs() {
  try {
    const botsSinSlug = await prisma.configuracionBot.findMany({
      where: { slug: null },
      include: { usuario: true }
    });

    if (botsSinSlug.length === 0) {
      console.log('✅ No hay bots pendientes.');
      return;
    }

    console.log(`⏳ Procesando ${botsSinSlug.length} bots...`);

    for (const bot of botsSinSlug) {
      const nombreBase = bot.nombreNegocio || bot.usuario.nombre || 'bot';
      let nuevoSlug = generarSlug(nombreBase);
      
      // Lógica para evitar duplicados:
      let existe = await prisma.configuracionBot.findUnique({ where: { slug: nuevoSlug } });
      let contador = 1;
      
      while (existe) {
        nuevoSlug = `${generarSlug(nombreBase)}-${contador}`;
        existe = await prisma.configuracionBot.findUnique({ where: { slug: nuevoSlug } });
        contador++;
      }

      await prisma.configuracionBot.update({
        where: { id: bot.id },
        data: { slug: nuevoSlug }
      });
      
      console.log(`✔ Actualizado: "${nombreBase}" -> slug: "${nuevoSlug}"`);
    }

    console.log('🚀 ¡Proceso finalizado con éxito!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

poblarSlugs();