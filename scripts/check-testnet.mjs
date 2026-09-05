// Public reads only. --capture writes local-emulator inputs, never transactions.
import { Buffer } from 'node:buffer';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { Cell } from '@ton/core';
import { addresses } from './contracts/config.mjs';
import {
  libraryReferences,
  verifiedLibraries,
  dependencyStatus,
} from './contracts/libraries.mjs';

const capture = process.argv.includes('--capture');
const base = 'https://testnet.toncenter.com/api/v2/';
async function read(url, body) {
  await delay(1100); // Public Toncenter access is rate-limited; no key is needed.
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    redirect: 'error',
    ...(body
      ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      : {}),
  });
  if (response.status === 404) return { unavailable: true };
  if (!response.ok)
    throw new Error(
      `Public read failed: HTTP ${response.status} at ${new URL(url).hostname}`,
    );
  const reader = response.body.getReader();
  let size = 0;
  const chunks = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 2000000) throw new Error('Public response exceeds limit');
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  const result = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (result.ok === false) throw new Error('Provider rejected public read');
  return result;
}
async function libraries(endpoint, hashes) {
  const response = await read(endpoint + 'getLibraries', { libraries: hashes });
  const entries = response.result?.result;
  const decoded = verifiedLibraries(entries);
  if ([...decoded.keys()].some((hash) => !hashes.includes(hash)))
    throw new Error('Unrequested library returned');
  return entries;
}

try {
  const accounts = {};
  for (const [name, address] of Object.entries(addresses)) {
    const response = await read(
      base + 'getAddressInformation?address=' + address,
    );
    const a = response.result;
    if (
      a?.state !== 'active' ||
      !/^\d+$/.test(a.balance) ||
      typeof a.code !== 'string' ||
      typeof a.data !== 'string'
    )
      throw new Error(`Unavailable contract: ${name}`);
    accounts[name] = {
      address,
      balance: a.balance,
      code: a.code,
      data: a.data,
      lastTransaction: a.last_transaction_id,
      observedAt: a.sync_utime,
    };
  }
  const roots = Object.values(accounts).flatMap((a) => [
    Cell.fromBase64(a.code),
    Cell.fromBase64(a.data),
  ]);
  let required = libraryReferences(roots);
  const testnetLibraries = await libraries(base, required);
  const available = verifiedLibraries(testnetLibraries);
  required = [
    ...new Set([...required, ...libraryReferences([...available.values()])]),
  ].sort();
  const status = dependencyStatus(required, available);
  const getters = {};
  for (const [name, method] of [
    ['router', 'get_router_version'],
    ['pool', 'get_pool_data'],
  ]) {
    const center = await read(base + 'runGetMethod', {
      address: addresses[name],
      method,
      stack: [],
    });
    const api = await read(
      `https://testnet.tonapi.io/v2/blockchain/accounts/${addresses[name]}/methods/${method}`,
    );
    if (
      !Number.isInteger(center.result?.exit_code) ||
      !Number.isInteger(api.exit_code)
    )
      throw new Error('Malformed getter observation');
    getters[name] = {
      toncenterExitCode: center.result.exit_code,
      tonapiExitCode: api.exit_code,
      tonapiSuccess: api.success === true,
    };
  }
  const independentLibraryCheck = {};
  for (const hash of status.missing) {
    const response = await read(
      `https://testnet.tonapi.io/v2/blockchain/libraries/${hash}`,
    );
    if (response.unavailable) independentLibraryCheck[hash] = 'not_found';
    else {
      const cell = Cell.fromBoc(Buffer.from(response.boc, 'hex'))[0];
      if (!cell || cell.hash().toString('hex') !== hash)
        throw new Error('Independent library hash mismatch');
      independentLibraryCheck[hash] = 'available_provider_disagreement';
    }
  }
  const report = {
    checkedAt: new Date().toISOString(),
    network: 'ton-testnet',
    ...status,
    getters,
    independentLibraryCheck,
    accounts: Object.fromEntries(
      Object.entries(accounts).map(([name, a]) => [
        name,
        {
          address: a.address,
          codeHash: Cell.fromBase64(a.code).hash().toString('hex'),
          dataHash: Cell.fromBase64(a.data).hash().toString('hex'),
          lastTransaction: a.lastTransaction,
          observedAt: a.observedAt,
        },
      ]),
    ),
  };
  await mkdir('output/contracts', { recursive: true });
  await writeFile(
    'output/contracts/preflight.json',
    JSON.stringify(report, null, 2) + '\n',
  );
  if (capture) {
    // Only bytecode is read from mainnet. It is mounted in a LOCAL VM, never
    // substituted into a public testnet request or used to approve execution.
    const restored = status.missing.length
      ? await libraries('https://toncenter.com/api/v2/', status.missing)
      : [];
    const combined = verifiedLibraries([...testnetLibraries, ...restored]);
    const allRequired = [
      ...new Set([...required, ...libraryReferences([...combined.values()])]),
    ];
    if (dependencyStatus(allRequired, combined).missing.length)
      throw new Error('Cannot capture complete local library dependency graph');
    const snapshot = {
      environment: 'local-tvm-restored-libraries',
      capturedAt: report.checkedAt,
      publicExecutionEnabled: false,
      accounts,
      testnetLibraries,
      restoredLibraries: restored,
      report,
    };
    await writeFile(
      'output/contracts/snapshot.json',
      JSON.stringify(snapshot, null, 2) + '\n',
    );
    console.log(
      'Captured public state for local TVM tests. Public execution remains disabled.',
    );
  }
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = capture
    ? 0
    : status.missing.length ||
        Object.values(getters).some(
          (g) =>
            g.toncenterExitCode !== 0 ||
            g.tonapiExitCode !== 0 ||
            !g.tonapiSuccess,
        )
      ? 2
      : 0;
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Preflight failed');
  process.exitCode = 1;
}
