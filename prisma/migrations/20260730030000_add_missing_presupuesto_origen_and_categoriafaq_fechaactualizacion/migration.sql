DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type AS type
    JOIN pg_namespace AS namespace ON namespace.oid = type.typnamespace
    WHERE namespace.nspname = current_schema()
      AND type.typname = 'OrigenPresupuesto'
  ) THEN
    EXECUTE 'CREATE TYPE "OrigenPresupuesto" AS ENUM (''EMPRENDEDOR'', ''CHATBOT'')';
  END IF;
END
$$;

-- Agregamos IF NOT EXISTS para que pase de largo si la columna quedó creada del intento anterior
ALTER TABLE "Presupuesto"
ADD COLUMN IF NOT EXISTS "origen" "OrigenPresupuesto";

UPDATE "Presupuesto"
SET "origen" = 'CHATBOT'::"OrigenPresupuesto"
WHERE "origen" IS NULL;

ALTER TABLE "Presupuesto"
ALTER COLUMN "origen" SET NOT NULL,
ALTER COLUMN "origen" SET DEFAULT 'EMPRENDEDOR';

-- Aplicamos la misma precaución para CategoriaFAQ
ALTER TABLE "CategoriaFAQ"
ADD COLUMN IF NOT EXISTS "fechaActualizacion" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

UPDATE "CategoriaFAQ"
SET "fechaActualizacion" = COALESCE("fechaCreacion", CURRENT_TIMESTAMP)
WHERE "fechaActualizacion" IS NULL;

ALTER TABLE "CategoriaFAQ"
ALTER COLUMN "fechaActualizacion" SET NOT NULL;