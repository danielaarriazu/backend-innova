CREATE EXTENSION IF NOT EXISTS unaccent;

ALTER TABLE "Faq"
ADD COLUMN "preguntaNormalizada" TEXT;

WITH "PreguntasNormalizadas" AS (
  SELECT
    "id",
    (
      SELECT STRING_AGG("palabra", ' ' ORDER BY "palabra" COLLATE "C")
      FROM REGEXP_SPLIT_TO_TABLE(
        BTRIM(
          REGEXP_REPLACE(
            UNACCENT(LOWER(BTRIM("pregunta"))),
            '[^[:alnum:][:space:]]+',
            ' ',
            'g'
          )
        ),
        '[[:space:]]+'
      ) AS "palabra"
      WHERE "palabra" <> ''
    ) AS "clave"
  FROM "Faq"
)
UPDATE "Faq" AS "faq"
SET "preguntaNormalizada" = "normalizada"."clave"
FROM "PreguntasNormalizadas" AS "normalizada"
WHERE "faq"."id" = "normalizada"."id";

WITH "FaqDuplicada" AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "botId", "preguntaNormalizada"
      ORDER BY "fechaCreacion", "id"
    ) AS "numero"
  FROM "Faq"
)
DELETE FROM "Faq"
WHERE "id" IN (
  SELECT "id"
  FROM "FaqDuplicada"
  WHERE "numero" > 1
);

ALTER TABLE "Faq"
ALTER COLUMN "preguntaNormalizada" SET NOT NULL;

CREATE UNIQUE INDEX "Faq_botId_preguntaNormalizada_key"
ON "Faq" ("botId", "preguntaNormalizada");
