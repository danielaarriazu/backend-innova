BEGIN;

-- El enum está declarado en schema.prisma pero nunca fue creado por una migración.
-- El bloque condicional evita intentar duplicarlo si otro entorno ya lo tuviera.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type AS type
    JOIN pg_namespace AS namespace ON namespace.oid = type.typnamespace
    WHERE namespace.nspname = current_schema()
      AND type.typname = 'OrigenPresupuesto'
  ) THEN
    CREATE TYPE "OrigenPresupuesto" AS ENUM ('EMPRENDEDOR', 'CHATBOT');
  END IF;
END
$$;

-- Se agrega nullable para permitir el backfill seguro de presupuestos existentes.
ALTER TABLE "Presupuesto"
ADD COLUMN "origen" "OrigenPresupuesto";

-- Todos los presupuestos históricos confirmados fueron generados desde el
-- flujo público del chatbot. No se infiere EMPRENDEDOR a partir de una clave
-- de idempotencia nula, porque existen registros legítimos del chatbot sin clave.
UPDATE "Presupuesto"
SET "origen" = 'CHATBOT'::"OrigenPresupuesto"
WHERE "origen" IS NULL;

ALTER TABLE "Presupuesto"
ALTER COLUMN "origen" SET NOT NULL,
ALTER COLUMN "origen" SET DEFAULT 'EMPRENDEDOR';

-- El default completa las filas actuales sin modificar ningún otro campo.
ALTER TABLE "CategoriaFAQ"
ADD COLUMN "fechaActualizacion" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- Respaldo explícito para cualquier fila que pudiera quedar sin valor.
UPDATE "CategoriaFAQ"
SET "fechaActualizacion" = COALESCE("fechaCreacion", CURRENT_TIMESTAMP)
WHERE "fechaActualizacion" IS NULL;

ALTER TABLE "CategoriaFAQ"
ALTER COLUMN "fechaActualizacion" SET NOT NULL;

COMMIT;
