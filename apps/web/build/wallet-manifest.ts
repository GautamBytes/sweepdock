import type { Plugin } from 'vite';

export function deploymentManifest(host: string | undefined) {
  if (!host) return null;
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.vercel\.app$/.test(host))
    throw new Error('Invalid Vercel deployment host');
  const url = `https://${host}`;
  return { url, name: 'SweepDock', iconUrl: `${url}/wallet-icon.png` };
}

export function walletManifestPlugin(host: string | undefined): Plugin {
  const manifest = deploymentManifest(host);
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
