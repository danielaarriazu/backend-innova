-- Campos aditivos para soportar totales calculados e idempotencia.
ALTER TABLE "Presupuesto"
ADD COLUMN "idempotencyKey" TEXT,
ADD COLUMN "total" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- Completa el total de presupuestos existentes a partir de su detalle JSON.
UPDATE "Presupuesto"
SET "total" = COALESCE(
  (
    SELECT SUM(
      COALESCE((item->>'cantidad')::numeric, 0)
      * COALESCE((item->>'precioUnitario')::numeric, 0)
    )
    FROM jsonb_array_elements("Presupuesto"."detalle") AS item
  ),
  0
);

CREATE UNIQUE INDEX "Presupuesto_idempotencyKey_key"
ON "Presupuesto"("idempotencyKey");

CREATE INDEX "Presupuesto_consultaId_fechaCreacion_idx"
ON "Presupuesto"("consultaId", "fechaCreacion");

CREATE INDEX "Presupuesto_estado_fechaCreacion_idx"
ON "Presupuesto"("estado", "fechaCreacion");
