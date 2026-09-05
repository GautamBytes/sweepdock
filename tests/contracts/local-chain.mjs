// Test-only harness. No network provider, real wallet, or public broadcast method.
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { Address, beginCell, Cell, Dictionary, toNano } from '@ton/core';
import { keyPairFromSeed } from '@ton/crypto';
import { WalletContractV4 } from '@ton/ton';
import { Blockchain, createShardAccount } from '@ton/sandbox';
import { DEX, pTON } from '@ston-fi/sdk';
import { addresses } from '../../scripts/contracts/config.mjs';
import { verifiedLibraries } from '../../scripts/contracts/libraries.mjs';

import {
  loadVerifiedCapture,
  verifyCapture,
} from '../../scripts/contracts/capture-policy.mjs';

export const { snapshot } = await loadVerifiedCapture();
export const contractAddresses = Object.fromEntries(
  Object.entries(addresses).map(([n, a]) => [n, Address.parse(a)]),
);
export async function createLocalChain(restore = true, source = snapshot) {
  verifyCapture(source);
  assert.equal(source.environment, 'local-tvm-restored-libraries');
  assert.equal(source.publicExecutionEnabled, false);
  const libs = verifiedLibraries([
    ...source.testnetLibraries,
    ...(restore ? source.restoredLibraries : []),
  ]);
  const dictionary = Dictionary.empty(
    Dictionary.Keys.Buffer(32),
    Dictionary.Values.Cell(),
  );
  for (const [hash, code] of libs)
    dictionary.set(Buffer.from(hash, 'hex'), code);
  const chain = await Blockchain.create();
  chain.now = Math.max(
    ...Object.values(source.accounts).map((a) => a.observedAt),
  );
  assert(Number.isSafeInteger(chain.now) && chain.now > 0);
  chain.verbosity = {
    print: false,
    blockchainLogs: false,
    vmLogs: 'vm_logs',
    debugLogs: false,
  };
  chain.libs = beginCell().storeDictDirect(dictionary).endCell();
  for (const [name, address] of Object.entries(contractAddresses)) {
    const a = source.accounts[name];
    assert(Address.parse(a.address).equals(address));
    const code = Cell.fromBase64(a.code),
      data = Cell.fromBase64(a.data);
    assert.equal(
      code.hash().toString('hex'),
      source.report.accounts[name].codeHash,
    );
    assert.equal(
      data.hash().toString('hex'),
      source.report.accounts[name].dataHash,
    );
    await chain.setShardAccount(
      address,
      createShardAccount({ address, code, data, balance: BigInt(a.balance) }),
    );
  }
  return {
    chain,
    router: chain.openContract(
      DEX.v2_1.Router.create(contractAddresses.router),
    ),
    pool: chain.openContract(DEX.v2_1.Pool.create(contractAddresses.pool)),
    pton: pTON.v2_1.create(contractAddresses.pton),
  };
}
export async function createLocalWallet(chain) {
  // Public dummy key, never funded on any network. Synthetic balance exists only in this VM.
  const key = keyPairFromSeed(Buffer.alloc(32, 42));
  const wallet = WalletContractV4.create({
    workchain: 0,
    walletId: 0x53574550,
    publicKey: key.publicKey,
  });
  await chain.setShardAccount(
    wallet.address,
    createShardAccount({
      address: wallet.address,
      ...wallet.init,
      balance: toNano('100'),
    }),
  );
  return { wallet, key: key.secretKey };
}
export async function tokenWallet(chain, master, owner) {
  return (
    await chain.runGetMethod(master, 'get_wallet_address', [
      { type: 'slice', cell: beginCell().storeAddress(owner).endCell() },
    ])
  ).stackReader.readAddress();
}
export async function tokenBalance(chain, wallet, owner, master) {
  assert((await tokenWallet(chain, master, owner)).equals(wallet));
  const data = (await chain.runGetMethod(wallet, 'get_wallet_data'))
    .stackReader;
  const balance = data.readBigNumber();
  assert(data.readAddress().equals(owner));
  assert(data.readAddress().equals(master));
  return balance;
}
export function assertSuccessfulTrace(result) {
  assert(result.transactions.length > 1);
  for (const tx of result.transactions) {
    assert.equal(tx.description.type, 'generic');
    assert.equal(tx.description.aborted, false);
    assert.equal(tx.description.computePhase.type, 'vm');
    assert.equal(tx.description.computePhase.success, true);
    if (tx.description.actionPhase)
      assert.equal(tx.description.actionPhase.success, true);
    if (tx.inMessage?.info.type === 'internal')
      assert.equal(tx.inMessage.info.bounced, false);
  }
}
