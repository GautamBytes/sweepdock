import { build } from 'esbuild';

// Bundle workspace TypeScript and dependencies: plain Node cannot resolve the
// source-only workspace exports or extensionless imports used by Vite.
await build({
  entryPoints: ['apps/api/src/handler.ts'],
  outfile: 'apps/api/dist/handler.mjs',
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'esm',
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
});
