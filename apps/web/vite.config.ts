import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { createLocalApiMiddleware } from '@sweepdock/api/vite';
import { walletManifestPlugin } from './build/wallet-manifest';

function readApi(mode: string): Plugin {
  const root = fileURLToPath(new URL('../..', import.meta.url));
  const config = loadEnv(mode, root, 'TONAPI_');
  const listener = createLocalApiMiddleware(config.TONAPI_KEY);
  return {
    name: 'sweepdock-read-only-api',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (!request.url?.startsWith('/api/')) return next();
        void listener(request, response);
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  root: fileURLToPath(new URL('.', import.meta.url)),
  envDir: fileURLToPath(new URL('../..', import.meta.url)),
  optimizeDeps: { include: ['@tonconnect/ui-react'] },
  plugins: [
    react(),
    tailwindcss(),
    readApi(mode),
    walletManifestPlugin(process.env),
  ],
  build: { outDir: 'dist', emptyOutDir: true },
  server: { host: '127.0.0.1' },
}));
