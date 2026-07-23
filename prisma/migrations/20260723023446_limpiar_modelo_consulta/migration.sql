/*
  Warnings:

  - You are about to drop the column `clienteNombre` on the `Consulta` table. All the data in the column will be lost.
  - You are about to drop the column `clienteTelefono` on the `Consulta` table. All the data in the column will be lost.
  - You are about to drop the column `derivadaA` on the `Consulta` table. All the data in the column will be lost.
  - You are about to drop the column `prioridad` on the `Consulta` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Consulta" DROP COLUMN "clienteNombre",
DROP COLUMN "clienteTelefono",
DROP COLUMN "derivadaA",
DROP COLUMN "prioridad";
