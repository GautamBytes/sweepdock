// @vitest-environment node
import { expect, it } from 'vitest';
import { deploymentManifest } from './wallet-manifest';

const preview = {
  VERCEL: '1',
  VERCEL_ENV: 'preview',
  VERCEL_URL: 'sweepdock-fixture.vercel.app',
  VERCEL_PROJECT_PRODUCTION_URL: 'sweepdock.vercel.app',
};

it('keeps preview wallet identity on its own deployment', () => {
  expect(deploymentManifest(preview)).toEqual({
    url: 'https://sweepdock-fixture.vercel.app',
    name: 'SweepDock',
    iconUrl: 'https://sweepdock-fixture.vercel.app/wallet-icon.png',
  });
});

it('uses the stable public origin for production wallet identity', () => {
  expect(deploymentManifest({ ...preview, VERCEL_ENV: 'production' })).toEqual({
    url: 'https://sweepdock.vercel.app',
    name: 'SweepDock',
    iconUrl: 'https://sweepdock.vercel.app/wallet-icon.png',
  });
});

it('leaves local builds unconfigured even if deployment URLs are present', () => {
  expect(deploymentManifest({})).toBeNull();
  expect(deploymentManifest({ ...preview, VERCEL: '0' })).toBeNull();
});

it('blocks production builds with no canonical origin', () => {
  expect(() =>
    deploymentManifest({
      VERCEL: '1',
      VERCEL_ENV: 'production',
      VERCEL_URL: preview.VERCEL_URL,
    }),
  ).toThrow('Missing Vercel wallet host');
});

it('rejects paths, credentials, localhost and unrelated hosts in both environments', () => {
  for (const host of [
    'localhost',
    'evil.example',
    'a.vercel.app/redirect',
    'a.vercel.app@evil.example',
    'https://a.vercel.app',
    'a.vercel.app?x=y',
  ]) {
    expect(() => deploymentManifest({ ...preview, VERCEL_URL: host })).toThrow(
      'Invalid Vercel deployment host',
    );
    expect(() =>
      deploymentManifest({
        ...preview,
        VERCEL_ENV: 'production',
        VERCEL_PROJECT_PRODUCTION_URL: host,
      }),
    ).toThrow('Invalid Vercel deployment host');
  }
});
