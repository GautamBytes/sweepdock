import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import {
  beginCell,
  Cell,
  external,
  internal,
  SendMode,
  storeMessage,
  toNano,
} from '@ton/core';
import { keyPairFromSeed } from '@ton/crypto';
import { snapshotToSerializable, snapshotFromSerializable } from '@ton/sandbox';
import {
  createLocalChain,
  createLocalWallet,
  snapshot,
  contractAddresses,
  tokenWallet,
  tokenBalance,
  assertSuccessfulTrace,
} from './local-chain.mjs';

const A = contractAddresses;

test('actual captured testnet libraries reproduce the missing router and pool code; exact code restores getters', async () => {
  const broken = await createLocalChain(false);
  for (const [address, method] of [
    [A.router, 'get_router_version'],
    [A.pool, 'get_pool_data'],
  ]) {
    await assert.rejects(
      broken.chain.runGetMethod(address, method),
      (error) =>
        error.exitCode === 9 &&
        error.vmLogs.includes('failed to load library cell'),
    );
  }
  const { chain, router, pool } = await createLocalChain();
  assert(
    (await tokenWallet(chain, A.token, A.router)).equals(A.routerTokenWallet),
  );
  assert(
    (await tokenWallet(chain, A.pton, A.router)).equals(A.routerPtonWallet),
  );
  assert.deepEqual(await router.getRouterVersion(), {
    major: 2,
    minor: 1,
    development: 'beta3.2',
  });
  const r = await router.getRouterData(),
    p = await pool.getPoolData();
  assert.equal(r.isLocked, false);
  assert.equal(p.isLocked, false);
  assert(p.routerAddress.equals(A.router));
  assert(p.token0WalletAddress.equals(A.routerTokenWallet));
  assert(p.token1WalletAddress.equals(A.routerPtonWallet));
  assert(p.reserve0 > 0n && p.reserve1 > 0n);
  assert(
    (
      await router.getPoolAddress({
        token0: A.routerTokenWallet,
        token1: A.routerPtonWallet,
      })
    ).equals(A.pool),
  );
});

test('rejects tampered code before executing a contract', async () => {
  const copy = structuredClone(snapshot);
  copy.restoredLibraries[0].hash = Buffer.alloc(32).toString('base64');
  await assert.rejects(createLocalChain(true, copy), /hash/i);
});

async function params(
  env,
  wallet,
  kind,
  amount,
  minimum = 1n,
  queryId = 101n,
  deadline = env.chain.now + 300,
) {
  const common = {
    userWalletAddress: wallet.address,
    proxyTon: env.pton,
    offerAmount: amount,
    minAskAmount: minimum,
    deadline,
    queryId,
    referralValue: 0,
  };
  return kind === 'buy'
    ? env.router.getSwapTonToJettonTxParams({
        ...common,
        askJettonAddress: A.token,
      })
    : env.router.getSwapJettonToTonTxParams({
        ...common,
        offerJettonAddress: A.token,
      });
}
async function envelope(env, wallet, key, tx) {
  const seqno = await env.chain.openContract(wallet).getSeqno();
  const body = wallet.createTransfer({
    seqno,
    secretKey: key,
    timeout: env.chain.now + 300,
    sendMode: SendMode.PAY_GAS_SEPARATELY,
    messages: [
      internal({ to: tx.to, value: tx.value, body: tx.body, bounce: true }),
    ],
  });
  return beginCell()
    .store(storeMessage(external({ to: wallet.address, body })))
    .endCell();
}

function inputTransaction(result, src, dest, opcode, queryId) {
  return result.transactions.find((t) => {
    const m = t.inMessage;
    if (
      m?.info.type !== 'internal' ||
      !m.info.src.equals(src) ||
      !m.info.dest.equals(dest) ||
      m.body.bits.length < 96
    )
      return false;
    const s = m.body.beginParse();
    return s.loadUint(32) === opcode && s.loadUintBig(64) === queryId;
  });
}

async function buy(env, wallet, key) {
  const tx = await params(env, wallet, 'buy', toNano('1'));
  const message = await envelope(env, wallet, key, tx);
  const result = await env.chain.sendMessage(message);
  assertSuccessfulTrace(result);
  const recipient = await tokenWallet(env.chain, A.token, wallet.address);
  const balance = await tokenBalance(
    env.chain,
    recipient,
    wallet.address,
    A.token,
  );
  assert(balance > 0n);
  const delivery = inputTransaction(
    result,
    A.routerTokenWallet,
    recipient,
    0x178d4519,
    101n,
  );
  assert(
    delivery,
    'expected token delivery from the verified router token wallet',
  );
  const body = delivery.inMessage.body.beginParse();
  body.skip(96);
  assert.equal(body.loadCoins(), balance);
  assert(
    beginCell()
      .store(storeMessage(result.transactions[0].inMessage))
      .endCell()
      .hash()
      .equals(message.hash()),
  );
  return { recipient, balance, result, message };
}

test('signed Wallet V4 messages execute TON → token → TON and verify actual delivery with matching query IDs', async () => {
  const env = await createLocalChain();
  const { wallet, key } = await createLocalWallet(env.chain);
  const { recipient, balance } = await buy(env, wallet, key);
  const tx = await params(env, wallet, 'sell', balance, 1n, 102n);
  const before = (await env.chain.getContract(wallet.address)).balance;
  const result = await env.chain.sendMessage(
    await envelope(env, wallet, key, tx),
  );
  assertSuccessfulTrace(result);
  const delivery = inputTransaction(
    result,
    A.routerPtonWallet,
    wallet.address,
    0x01f3835d,
    102n,
  );
  assert(
    delivery,
    'TON payout must arrive from the verified router pTON wallet',
  );
  assert(delivery.inMessage.info.value.coins > 0n);
  assert((await env.chain.getContract(wallet.address)).balance > before);
  assert.equal(
    await tokenBalance(env.chain, recipient, wallet.address, A.token),
    0n,
  );
});

test('impossible minimum output returns all input tokens instead of claiming a completed swap', async () => {
  const env = await createLocalChain();
  const { wallet, key } = await createLocalWallet(env.chain);
  const { recipient, balance } = await buy(env, wallet, key);
  const result = await env.chain.sendMessage(
    await envelope(
      env,
      wallet,
      key,
      await params(env, wallet, 'sell', balance, toNano('1000000'), 103n),
    ),
  );
  assertSuccessfulTrace(result);
  const refund = inputTransaction(
    result,
    A.routerTokenWallet,
    recipient,
    0x178d4519,
    103n,
  );
  assert(
    refund,
    'refund must be an actual return transfer with the original query ID',
  );
  const body = refund.inMessage.body.beginParse();
  body.skip(96);
  assert.equal(body.loadCoins(), balance);
  assert.equal(
    await tokenBalance(env.chain, recipient, wallet.address, A.token),
    balance,
  );
  assert.equal(
    inputTransaction(
      result,
      A.routerPtonWallet,
      wallet.address,
      0x01f3835d,
      103n,
    ),
    undefined,
  );
});

test('expired router deadline refunds tokens', async () => {
  const env = await createLocalChain();
  const { wallet, key } = await createLocalWallet(env.chain);
  const { recipient, balance } = await buy(env, wallet, key);
  const result = await env.chain.sendMessage(
    await envelope(
      env,
      wallet,
      key,
      await params(env, wallet, 'sell', balance, 1n, 104n, env.chain.now - 1),
    ),
  );
  assertSuccessfulTrace(result);
  assert(
    inputTransaction(result, A.routerTokenWallet, recipient, 0x178d4519, 104n),
  );
  assert.equal(
    await tokenBalance(env.chain, recipient, wallet.address, A.token),
    balance,
  );
});

test('wrong signature cannot advance seqno or reach the router', async () => {
  const env = await createLocalChain();
  const { wallet } = await createLocalWallet(env.chain);
  const wrongKey = keyPairFromSeed(Buffer.alloc(32, 99)).secretKey;
  const message = await envelope(
    env,
    wallet,
    wrongKey,
    await params(env, wallet, 'buy', toNano('1')),
  );
  await assert.rejects(
    env.chain.sendMessage(message),
    (error) => error.exitCode === 35 || /exit_code: 35/.test(error.message),
  );
  assert.equal(await env.chain.openContract(wallet).getSeqno(), 0);
});

test('restored chain state rejects replay of the exact signed message without sending a second swap', async () => {
  const env = await createLocalChain();
  const { wallet, key } = await createLocalWallet(env.chain);
  const { recipient, balance, message } = await buy(env, wallet, key);
  const restored = await createLocalChain();
  const saved = JSON.stringify(snapshotToSerializable(env.chain.snapshot()));
  await restored.chain.loadFrom(snapshotFromSerializable(JSON.parse(saved)));
  await assert.rejects(
    restored.chain.sendMessage(
      Cell.fromBase64(message.toBoc().toString('base64')),
    ),
    (error) => error.exitCode === 33 || /exit_code: 33/.test(error.message),
  );
  assert.equal(await restored.chain.openContract(wallet).getSeqno(), 1);
  assert.equal(
    await tokenBalance(restored.chain, recipient, wallet.address, A.token),
    balance,
  );
});

test('rejects a substituted account even when its embedded report was updated to match', async () => {
  const copy = structuredClone(snapshot);
  const code = beginCell().storeUint(42, 8).endCell();
  copy.accounts.router.code = code.toBoc().toString('base64');
  copy.report.accounts.router.codeHash = code.hash().toString('hex');
  await assert.rejects(createLocalChain(true, copy), /Unreviewed router code/);
});
