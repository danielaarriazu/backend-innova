/*
  Warnings:

  - You are about to drop the column `rubro` on the `Usuario` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ConfiguracionBot" ADD COLUMN     "descripcionBreve" TEXT,
ADD COLUMN     "horarioAtencion" TEXT,
ADD COLUMN     "respuestaDerivacion" TEXT,
ADD COLUMN     "rubro" TEXT,
ADD COLUMN     "telefono" TEXT;

-- AlterTable
ALTER TABLE "Usuario" DROP COLUMN "rubro";
