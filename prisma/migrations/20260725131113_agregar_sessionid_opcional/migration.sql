/*
  Warnings:

  - You are about to drop the column `numeroCliente` on the `SesionChat` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[botId,sessionId]` on the table `SesionChat` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "SesionChat_botId_numeroCliente_key";

-- AlterTable
ALTER TABLE "SesionChat" DROP COLUMN "numeroCliente",
ADD COLUMN     "sessionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "SesionChat_botId_sessionId_key" ON "SesionChat"("botId", "sessionId");
