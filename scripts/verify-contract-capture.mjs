import { mkdir, writeFile } from 'node:fs/promises';
import { loadVerifiedCapture } from './contracts/capture-policy.mjs';
const { proof } = await loadVerifiedCapture();
await mkdir('output/contracts', { recursive: true });
await writeFile(
  'output/contracts/capture-proof.json',
  JSON.stringify(proof, null, 2) + '\n',
);
console.log(JSON.stringify(proof, null, 2));
