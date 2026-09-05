import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { beginCell, Cell } from '@ton/core';
import {
  libraryReferences,
  verifiedLibraries,
  dependencyStatus,
} from '../../scripts/contracts/libraries.mjs';

const code = beginCell().storeUint(123, 32).endCell();
const hash = code.hash().toString('hex');
const ref = new Cell({
  exotic: true,
  bits: beginCell().storeUint(2, 8).storeBuffer(code.hash()).endCell().bits,
});
const entry = {
  hash: code.hash().toString('base64'),
  data: code.toBoc().toString('base64'),
};

test('finds shared-code dependencies inside code and storage without treating ordinary cells as libraries', () => {
  const root = beginCell()
    .storeRef(ref)
    .storeRef(beginCell().storeRef(ref).endCell())
    .endCell();
  assert.deepEqual(libraryReferences([root, code]), [hash]);
});
test('accepts only code whose computed hash matches the requested library', () => {
  assert.equal(
    verifiedLibraries([entry]).get(hash).hash().toString('hex'),
    hash,
  );
  assert.throws(
    () =>
      verifiedLibraries([
        { ...entry, hash: Buffer.alloc(32).toString('base64') },
      ]),
    /hash/i,
  );
});
test('rejects malformed and conflicting provider entries', () => {
  assert.throws(
    () => verifiedLibraries([{ ...entry, data: 'invalid' }]),
    /library/i,
  );
  assert.throws(() => verifiedLibraries([entry, entry]), /duplicate/i);
});
test('missing pool code blocks the dependency check even if the router code resolves', () => {
  const poolHash = 'f'.repeat(64);
  assert.deepEqual(
    dependencyStatus([hash, poolHash], verifiedLibraries([entry])),
    {
      status: 'missing_libraries',
      missing: [poolHash],
      publicExecutionEnabled: false,
    },
  );
});
test('available code never claims route, signing or settlement readiness', () => {
  assert.deepEqual(dependencyStatus([hash], verifiedLibraries([entry])), {
    status: 'libraries_available_route_unverified',
    missing: [],
    publicExecutionEnabled: false,
  });
});
