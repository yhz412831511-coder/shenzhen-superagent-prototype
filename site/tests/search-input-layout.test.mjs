import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const memoryPage = readFileSync(
  new URL('../app/memory-page.tsx', import.meta.url),
  'utf8',
);
const modelRouting = readFileSync(
  new URL('../app/model-routing.tsx', import.meta.url),
  'utf8',
);
const fiscalCss = readFileSync(
  new URL('../app/fiscal.css', import.meta.url),
  'utf8',
);

test('overlay search inputs use the shared icon-safe layout', () => {
  assert.match(memoryPage, /fw-input-with-icon/);
  assert.match(modelRouting, /fw-input-with-icon/);
  assert.match(
    fiscalCss,
    /\.fw-input-with-icon > input\s*\{[^}]*padding-left:\s*40px\s*!important;/s,
  );
});

test('memory search no longer relies on conflicting utility padding', () => {
  const searchField = memoryPage.match(
    /<label className="fw-input-with-icon[\s\S]*?<\/label>/,
  )?.[0];
  assert.ok(searchField);
  assert.doesNotMatch(searchField, /className=\{inputClass \+ ' pl-/);
  assert.match(searchField, /top-1\/2/);
  assert.match(searchField, /-translate-y-1\/2/);
});
