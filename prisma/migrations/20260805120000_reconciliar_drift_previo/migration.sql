-- Reconciliar el historial de migraciones con cambios que ya estaban aplicados
-- en la base real (via `prisma db push`) pero nunca quedaron registrados como
-- migración. Esta migración se marca como "applied" sin ejecutarse — no borra
-- ni modifica ninguna fila existente.

-- AlterEnum
ALTER TYPE "EstadoConsulta" ADD VALUE IF NOT EXISTS 'INICIADA';

-- AlterTable
ALTER TABLE "Faq" ALTER COLUMN "preguntaNormalizada" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Producto_botId_nombre_key" ON "Producto"("botId", "nombre");