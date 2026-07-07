/*
  Warnings:

  - You are about to drop the column `rubro` on the `ConfiguracionBot` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ConfiguracionBot" DROP COLUMN "rubro",
ADD COLUMN     "rubroId" TEXT;

-- CreateTable
CREATE TABLE "Rubro" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Rubro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rubro_nombre_key" ON "Rubro"("nombre");

-- AddForeignKey
ALTER TABLE "ConfiguracionBot" ADD CONSTRAINT "ConfiguracionBot_rubroId_fkey" FOREIGN KEY ("rubroId") REFERENCES "Rubro"("id") ON DELETE SET NULL ON UPDATE CASCADE;
