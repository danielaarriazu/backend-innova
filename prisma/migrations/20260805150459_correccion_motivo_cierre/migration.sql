/*
  Warnings:

  - You are about to drop the column `MotivoCierre` on the `Consulta` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Consulta" DROP COLUMN "MotivoCierre",
ADD COLUMN     "motivoCierre" "MotivoCierre";
