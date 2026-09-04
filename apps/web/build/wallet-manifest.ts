import type { Plugin } from 'vite';

type DeploymentEnvironment = Record<string, string | undefined>;

export function deploymentManifest(environment: DeploymentEnvironment) {
  if (environment.VERCEL !== '1') return null;
  const host =
    environment.VERCEL_ENV === 'production'
      ? environment.VERCEL_PROJECT_PRODUCTION_URL
      : environment.VERCEL_URL;
  if (!host) throw new Error('Missing Vercel wallet host');
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.vercel\.app$/.test(host))
    throw new Error('Invalid Vercel deployment host');
  const url = `https://${host}`;
  return { url, name: 'SweepDock', iconUrl: `${url}/wallet-icon.png` };
}

export function walletManifestPlugin(
  environment: DeploymentEnvironment,
): Plugin {
  const manifest = deploymentManifest(environment);
  return {
    name: 'sweepdock-wallet-manifest',
    apply: 'build',
    config() {
      if (!manifest) return;
      return {
        define: {
          'import.meta.env.VITE_TONCONNECT_MANIFEST_URL': JSON.stringify(
            `${manifest.url}/tonconnect-manifest.json`,
          ),
        },
      };
    },
    generateBundle() {
      if (manifest)
        this.emitFile({
          type: 'asset',
          fileName: 'tonconnect-manifest.json',
          source: JSON.stringify(manifest, null, 2),
        });
    },
  };
}
