import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, copyFile, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';

const root = resolve('.');
const manifest = JSON.parse(
  await readFile('packages/core/package.json', 'utf8'),
);
const archive =
  manifest.name.replace('@', '').replace('/', '-') +
  '-' +
  manifest.version +
  '.tgz';
const temp = await mkdtemp(join(tmpdir(), 'sweepdock-consumer-'));
try {
  await writeFile(
    join(temp, 'package.json'),
    JSON.stringify({
      name: 'sweepdock-independent-consumer',
      private: true,
      type: 'module',
    }),
  );
  for (const name of ['index.mjs', 'types.ts'])
    await copyFile('examples/core-consumer/' + name, join(temp, name));
  // This installs the packed artifact, never a workspace symlink or TypeScript source alias.
  execFileSync(
    'npm',
    [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      resolve('output/core-package', archive),
      '@types/node@24.13.3',
    ],
    { cwd: temp, stdio: 'pipe', timeout: 120000 },
  );
  execFileSync(
    process.execPath,
    [
      root + '/node_modules/typescript/bin/tsc',
      '--noEmit',
      '--strict',
      '--module',
      'NodeNext',
      '--target',
      'ES2022',
      'types.ts',
    ],
    { cwd: temp, stdio: 'inherit' },
  );
  const result = JSON.parse(
    execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        "globalThis.fetch = () => { throw new Error('Offline example must not fetch'); }; await import('./index.mjs');",
      ],
      { cwd: temp, encoding: 'utf8' },
    ),
  );
  assert.equal(result.environment, 'offline-example');
  assert.equal(result.withinBudget, true);
  assert.deepEqual(result.decisions, [
    { asset: 'STON', reason: 'WITHIN_COST_LIMIT' },
    { asset: 'NOT', reason: 'COST_TOO_HIGH' },
  ]);
  assert.equal(result.requiredTonUnits, '310000000');
  assert.equal(result.recoveryState, 'unknown');
  assert.equal(result.report.environment, 'simulation');
  assert(!JSON.stringify(result.report).includes('private-fixture-identifier'));
  console.log(
    'Packed core: standalone Node ESM, strict NodeNext types, cost rejection, reserve and anonymous simulation report passed.',
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  await rm(temp, { recursive: true, force: true });
}
