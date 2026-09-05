import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Address, Cell } from '@ton/core';
import { verifiedLibraries } from './libraries.mjs';

const policy = JSON.parse(
  await readFile(
    new URL('../../tests/contracts/capture-policy.json', import.meta.url),
    'utf8',
  ),
);

/** Pins reviewed executable code independently of the downloaded report. Data may change. */
export function verifyCapture(source) {
  assert.equal(source.environment, 'local-tvm-restored-libraries');
  assert.equal(source.publicExecutionEnabled, false);
  assert.equal(source.report.network, 'ton-testnet');
  assert.equal(source.report.publicExecutionEnabled, false);
  assert(
    Number.isFinite(Date.parse(source.capturedAt)),
    'Invalid capture date',
  );
  assert.deepEqual(
    Object.keys(source.accounts).sort(),
    Object.keys(policy.accounts).sort(),
  );
  for (const [name, expected] of Object.entries(policy.accounts)) {
    const account = source.accounts[name];
    assert(
      Address.parse(account.address).equals(Address.parse(expected.address)),
      `Unexpected ${name} address`,
    );
    assert(/^\d{1,78}$/.test(account.balance), 'Invalid balance');
    assert(
      Number.isSafeInteger(account.observedAt) && account.observedAt > 0,
      'Invalid observation time',
    );
    const codeHash = Cell.fromBase64(account.code).hash().toString('hex');
    const dataHash = Cell.fromBase64(account.data).hash().toString('hex');
    assert.equal(codeHash, expected.codeHash, `Unreviewed ${name} code`);
    assert.equal(codeHash, source.report.accounts[name].codeHash);
    assert.equal(
      dataHash,
      source.report.accounts[name].dataHash,
      `Corrupt ${name} data`,
    );
  }
  const libraries = verifiedLibraries([
    ...source.testnetLibraries,
    ...source.restoredLibraries,
  ]);
  assert.deepEqual(
    [...libraries.keys()].sort(),
    policy.libraryHashes,
    'Unreviewed library set',
  );
  return {
    capturedAt: source.capturedAt,
    codePolicy: policy.reviewedAt,
    accountCount: Object.keys(source.accounts).length,
    libraryCount: libraries.size,
    publicExecutionEnabled: false,
  };
}

export async function loadVerifiedCapture(
  path = 'output/contracts/snapshot.json',
) {
  const bytes = await readFile(path);
  assert(bytes.length <= 2_000_000, 'Capture exceeds size limit');
  const snapshot = JSON.parse(bytes.toString('utf8'));
  const proof = {
    ...verifyCapture(snapshot),
    snapshotSha256: createHash('sha256').update(bytes).digest('hex'),
  };
  return { snapshot, proof };
}
