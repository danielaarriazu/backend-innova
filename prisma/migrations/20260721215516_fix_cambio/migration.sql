/*
  Warnings:

  - You are about to drop the column `sessionAnonimaId` on the `Consulta` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Consulta_sessionAnonimaId_idx";

-- AlterTable
ALTER TABLE "Consulta" DROP COLUMN "sessionAnonimaId",
ADD COLUMN     "sessionId" TEXT;

-- CreateIndex
CREATE INDEX "Consulta_sessionId_idx" ON "Consulta"("sessionId");
