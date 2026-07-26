/*
  Warnings:

  - Made the column `sessionId` on table `SesionChat` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "SesionChat" ALTER COLUMN "sessionId" SET NOT NULL;
