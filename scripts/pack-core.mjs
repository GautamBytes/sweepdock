import { execFileSync } from 'node:child_process';
import {
  mkdir,
  readdir,
  readFile,
  writeFile,
  copyFile,
  rm,
} from 'node:fs/promises';
import { resolve } from 'node:path';

await rm('packages/core/dist', { recursive: true, force: true });
execFileSync(
  process.execPath,
  [
    'node_modules/typescript/bin/tsc',
    '-p',
    'packages/core/tsconfig.build.json',
  ],
  { stdio: 'inherit' },
);
const destination = resolve('output/core-package');
await rm(destination, { recursive: true, force: true });
await mkdir(destination + '/dist', { recursive: true });
for (const name of await readdir('packages/core/dist')) {
  if (!/\.(js|d\.ts)$/.test(name)) continue;
  const source = await readFile('packages/core/dist/' + name, 'utf8');
  // Node ESM requires extensions; workspace bundlers do not. Apply only to our emitted relative imports.
  const esm = source.replace(
    /(from\s+['"]|import\(['"])(\.\/[^'"]+)(['"])/g,
    (_, before, path, after) =>
      before + path + (path.endsWith('.js') ? '' : '.js') + after,
  );
  await writeFile(destination + '/dist/' + name, esm);
}
const original = JSON.parse(
  await readFile('packages/core/package.json', 'utf8'),
);
const exports = Object.fromEntries(
  Object.entries(original.exports).map(([key, source]) => {
    const stem = source.replace('./src/', './dist/').replace(/\.ts$/, '');
    return [key, { types: stem + '.d.ts', import: stem + '.js' }];
  }),
);
await writeFile(
  destination + '/package.json',
  JSON.stringify(
    {
      ...original,
      description:
        'Experimental read-only TON cleanup policy and simulation diagnostics',
      exports,
      files: ['dist', 'LICENSE', 'README.md'],
    },
    null,
    2,
  ) + '\n',
);
await copyFile('LICENSE', destination + '/LICENSE');
await copyFile('examples/core-consumer/README.md', destination + '/README.md');
const packed = JSON.parse(
  execFileSync('npm', ['pack', '--ignore-scripts', '--json'], {
    cwd: destination,
    encoding: 'utf8',
  }),
);
console.log(resolve(destination, packed[0].filename));
