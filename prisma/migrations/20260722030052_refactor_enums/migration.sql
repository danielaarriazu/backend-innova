/*
  Warnings:

  - The values [DOCUMENTO,SISTEMA,SISTEMA_CLIENTE] on the enum `TipoMensaje` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TipoMensaje_new" AS ENUM ('TEXTO', 'ACCION', 'PRESUPUESTO');
ALTER TABLE "Mensaje" ALTER COLUMN "tipoMensaje" DROP DEFAULT;
ALTER TABLE "Mensaje" ALTER COLUMN "tipoMensaje" TYPE "TipoMensaje_new" USING ("tipoMensaje"::text::"TipoMensaje_new");
ALTER TYPE "TipoMensaje" RENAME TO "TipoMensaje_old";
ALTER TYPE "TipoMensaje_new" RENAME TO "TipoMensaje";
DROP TYPE "TipoMensaje_old";
ALTER TABLE "Mensaje" ALTER COLUMN "tipoMensaje" SET DEFAULT 'TEXTO';
COMMIT;
