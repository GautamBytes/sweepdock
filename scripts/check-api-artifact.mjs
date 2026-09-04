import assert from 'node:assert/strict';
import { mkdtemp, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Import outside the checkout so monorepo dependencies cannot hide packaging bugs.
const source = resolve(process.argv[2] ?? 'apps/api/dist/handler.mjs');
const directory = await mkdtemp(join(tmpdir(), 'sweepdock-api-'));
try {
  const artifact = join(directory, 'handler.mjs');
  await copyFile(source, artifact);
  const { default: handler } = await import(pathToFileURL(artifact).href);
  const origin = 'https://sweepdock.example';
  const health = await handler.fetch(new Request(`${origin}/api/health`));
  assert.equal(health.status, 200);
  assert.equal(health.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await health.json(), {
    mode: 'read-only',
    signingEnabled: false,
  });
  const config = await handler.fetch(new Request(`${origin}/api/config`));
  assert.equal(config.status, 200);
  assert.equal((await config.json()).readOnly, true);
  const blocked = await handler.fetch(
    new Request(`${origin}/api/balances`, {
      method: 'POST',
      headers: { origin: 'https://another.example' },
      body: '{}',
    }),
  );
  assert.equal(blocked.status, 403);
  const invalid = await handler.fetch(
    new Request(`${origin}/api/balances`, {
      method: 'POST',
      headers: { origin, 'content-type': 'application/json' },
      body: '{}',
    }),
  );
  assert.equal(invalid.status, 400);
  const signing = await handler.fetch(
    new Request(`${origin}/api/sign`, { method: 'POST' }),
  );
  assert.equal(signing.status, 404);
  console.log(
    'Standalone API artifact: health, config, origin rejection, invalid input and disabled signing passed.',
  );
} finally {
  await rm(directory, { recursive: true, force: true });
}
