// @vitest-environment node
import { expect, it } from 'vitest';
import { deploymentManifest } from './wallet-manifest';

it('uses only the verified deployment host for wallet identity', () => {
  expect(deploymentManifest('sweepdock-fixture.vercel.app')).toEqual({
    url: 'https://sweepdock-fixture.vercel.app',
    name: 'SweepDock',
    iconUrl: 'https://sweepdock-fixture.vercel.app/wallet-icon.png',
  });
});
it('leaves local builds unconfigured', () => {
  expect(deploymentManifest(undefined)).toBeNull();
});
it('rejects paths, credentials, localhost and unrelated hosts', () => {
  for (const host of [
    'localhost',
    'evil.example',
    'a.vercel.app/redirect',
    'a.vercel.app@evil.example',
    'https://a.vercel.app',
    'a.vercel.app?x=y',
  ]) {
    expect(() => deploymentManifest(host)).toThrow(
      'Invalid Vercel deployment host',
    );
  }
});
