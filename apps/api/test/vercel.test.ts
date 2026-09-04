// @vitest-environment node
import { expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import handler from '../src/handler';
import deployment from '../../../vercel.json';

it('keeps direct documentation and safety links refreshable in deployment', () => {
  for (const source of ['/docs', '/docs/:path*', '/safety', '/safety/doctor'])
    expect(deployment.rewrites).toContainEqual({
      source,
      destination: '/index.html',
    });
});

it('serves read-only health through the Vercel Web Standard handler', async () => {
  const response = await handler.fetch(
    new Request('https://sweepdock.example/api/health'),
  );
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    mode: 'read-only',
    signingEnabled: false,
  });
});

it('does not turn signing endpoints into a deployed API', async () => {
  const response = await handler.fetch(
    new Request('https://sweepdock.example/api/sign', { method: 'POST' }),
  );
  expect(response.status).toBe(404);
});

it('retains same-origin protections after deployment', async () => {
  const response = await handler.fetch(
    new Request('https://sweepdock.example/api/balances', {
      method: 'POST',
      headers: {
        origin: 'https://another.example',
        'content-type': 'application/json',
      },
      body: '{}',
    }),
  );
  expect(response.status).toBe(403);
});

it('uploads website Docs while excluding repository docs and secrets', () => {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const paths = [
    'apps/web/src/features/docs/Docs.tsx',
    'apps/web/src/features/docs/content.tsx',
    'apps/web/src/features/docs/docs.css',
    'docs/operations/vercel.md',
    '.env.local',
  ];
  const result = spawnSync(
    'git',
    [
      '-c',
      'core.excludesFile=.vercelignore',
      'check-ignore',
      '--no-index',
      '--stdin',
    ],
    { cwd: root, input: paths.join('\n'), encoding: 'utf8' },
  );
  expect(result.status).toBe(0);
  expect(result.stdout.trim().split('\n')).toEqual([
    'docs/operations/vercel.md',
    '.env.local',
  ]);
});
