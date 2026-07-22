-- Distingue el slug generado automáticamente del único cambio manual permitido.
ALTER TABLE "ConfiguracionBot"
ADD COLUMN "slugPersonalizado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "slugEditadoEn" TIMESTAMP(3);
