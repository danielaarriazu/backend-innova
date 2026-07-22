-- ExtendEnum
ALTER TYPE "EstadoConsulta" ADD VALUE IF NOT EXISTS 'RESUELTA';
ALTER TYPE "CerradaPor" ADD VALUE IF NOT EXISTS 'ADMIN';
ALTER TYPE "CerradaPor" ADD VALUE IF NOT EXISTS 'CLIENTE';

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN "consultaId" TEXT;

-- CreateTable
CREATE TABLE "eventos_telemetry" (
    "id" TEXT NOT NULL,
    "botId" TEXT,
    "sessionId" TEXT NOT NULL,
    "tipoUsuario" TEXT NOT NULL DEFAULT 'ANONIMO',
    "usuarioId" TEXT,
    "ip" TEXT NOT NULL DEFAULT 'desconocida',
    "dispositivo" TEXT NOT NULL DEFAULT 'desconocido',
    "fechaServidor" TIMESTAMP(3) NOT NULL,
    "eventos" JSONB NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_telemetry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "Consulta"("id") ON DELETE SET NULL ON UPDATE CASCADE;
