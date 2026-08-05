-- Reconciliar los cambios de esquema pendientes que no habían quedado
-- registrados en el historial de migraciones.

-- AlterTable
ALTER TABLE "Faq" ALTER COLUMN "preguntaNormalizada" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Producto_botId_nombre_key" ON "Producto"("botId", "nombre");
