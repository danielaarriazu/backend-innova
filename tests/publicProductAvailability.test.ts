import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const publicService = readFileSync(
  new URL('../src/services/public.service.ts', import.meta.url),
  'utf8',
);
const productService = readFileSync(
  new URL('../src/services/product.service.ts', import.meta.url),
  'utf8',
);

test('el init público determina disponibilidad únicamente por activo', () => {
  assert.match(publicService, /disponible:\s*producto\.activo,/);
  assert.doesNotMatch(publicService, /disponible:[^\n]*stock/);
});

test('la compatibilidad de creación y edición con stock permanece intacta', () => {
  assert.match(productService, /stock:\s*data\.stock\s*\?\?\s*0/);
  assert.match(
    productService,
    /stock:\s*data\.stock\s*!==\s*undefined\s*\?\s*data\.stock\s*:\s*productoExistente\.stock/,
  );
});
