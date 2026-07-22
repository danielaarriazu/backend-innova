-- CreateEnum
CREATE TYPE "EstadoConsulta" AS ENUM ('NUEVA', 'EN_PROCESO', 'CERRADA');

-- CreateEnum
CREATE TYPE "CerradaPor" AS ENUM ('BOT', 'EMPRENDEDOR');

-- CreateTable
CREATE TABLE "Consulta" (
    "id" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "sessionAnonimaId" TEXT,
    "clienteNombre" TEXT,
    "clienteTelefono" TEXT,
    "estado" "EstadoConsulta" NOT NULL DEFAULT 'NUEVA',
    "derivada" BOOLEAN NOT NULL DEFAULT false,
    "cerradaPor" "CerradaPor",
    "tipoConsulta" TEXT,
    "prioridad" TEXT,
    "canal" TEXT NOT NULL DEFAULT 'web',
    "asunto" TEXT,
    "descripcion" TEXT,
    "derivadaA" TEXT,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL,
    "fechaCierre" TIMESTAMP(3),
    CONSTRAINT "Consulta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mensaje" (
    "id" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "mensajePadreId" TEXT,
    "emisor" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "tipoMensaje" TEXT DEFAULT 'texto',
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Mensaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultaProducto" (
    "id" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConsultaProducto_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Consulta_botId_fechaActualizacion_idx" ON "Consulta"("botId", "fechaActualizacion");
CREATE INDEX "Consulta_sessionAnonimaId_idx" ON "Consulta"("sessionAnonimaId");
CREATE INDEX "Mensaje_consultaId_fechaCreacion_idx" ON "Mensaje"("consultaId", "fechaCreacion");
CREATE UNIQUE INDEX "ConsultaProducto_consultaId_productoId_key" ON "ConsultaProducto"("consultaId", "productoId");

ALTER TABLE "Consulta" ADD CONSTRAINT "Consulta_botId_fkey" FOREIGN KEY ("botId") REFERENCES "ConfiguracionBot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Mensaje" ADD CONSTRAINT "Mensaje_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "Consulta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Mensaje" ADD CONSTRAINT "Mensaje_mensajePadreId_fkey" FOREIGN KEY ("mensajePadreId") REFERENCES "Mensaje"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConsultaProducto" ADD CONSTRAINT "ConsultaProducto_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "Consulta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConsultaProducto" ADD CONSTRAINT "ConsultaProducto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
