-- CreateEnum
CREATE TYPE "estadoPresupuesto" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'ENVIADO', 'CONCRETADO', 'RECHAZADO');

-- CreateTable
CREATE TABLE "Presupuesto" (
    "id" SERIAL NOT NULL,
    "estado" "estadoPresupuesto" NOT NULL DEFAULT 'PENDIENTE',
    "linkPdf" TEXT,
    "fechaEmision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validezDias" INTEGER NOT NULL DEFAULT 10,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "detalle" JSONB NOT NULL,
    "consultaId" TEXT NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Presupuesto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Presupuesto" ADD CONSTRAINT "Presupuesto_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "Consulta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
