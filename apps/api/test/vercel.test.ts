// @vitest-environment node
import { expect, it } from 'vitest';
import handler from '../../../api/[...path]';
import deployment from '../../../vercel.json';

it('keeps direct safety-lab links refreshable in the deployment config', () => {
  for (const source of ['/safety', '/safety/doctor'])
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
