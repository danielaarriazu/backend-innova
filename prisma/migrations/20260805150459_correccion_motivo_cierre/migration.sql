-- Conservar los datos si la columna fue creada con la capitalización anterior.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Consulta'
      AND column_name = 'MotivoCierre'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Consulta'
      AND column_name = 'motivoCierre'
  ) THEN
    ALTER TABLE "Consulta" RENAME COLUMN "MotivoCierre" TO "motivoCierre";
  END IF;
END
$$;

-- Cubrir de forma idempotente bases donde ninguna de las dos columnas exista.
ALTER TABLE "Consulta"
ADD COLUMN IF NOT EXISTS "motivoCierre" "MotivoCierre";
