/*
  Warnings:

  - The `emisor` column on the `Mensaje` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `tipoMensaje` column on the `Mensaje` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "RolEmisor" AS ENUM ('CLIENTE', 'BOT', 'EMPRENDEDOR');

-- CreateEnum
CREATE TYPE "TipoMensaje" AS ENUM ('TEXTO', 'DOCUMENTO', 'SISTEMA', 'SISTEMA_CLIENTE');

-- AlterTable
ALTER TABLE "Mensaje" DROP COLUMN "emisor",
ADD COLUMN     "emisor" "RolEmisor" NOT NULL DEFAULT 'CLIENTE',
DROP COLUMN "tipoMensaje",
ADD COLUMN     "tipoMensaje" "TipoMensaje" NOT NULL DEFAULT 'SISTEMA';

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "mensajeId" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_mensajeId_key" ON "Lead"("mensajeId");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_consultaId_key" ON "Lead"("consultaId");

-- CreateIndex
CREATE INDEX "Mensaje_emisor_idx" ON "Mensaje"("emisor");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_mensajeId_fkey" FOREIGN KEY ("mensajeId") REFERENCES "Mensaje"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "Consulta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
