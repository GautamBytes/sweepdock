import { z } from 'zod';
import {
  normalizeMainnetAddress,
  reviewedAssets,
  matchReviewedAsset,
} from '@sweepdock/core/assets';
import {
  balancesSchema,
  ReadError,
  unitsSchema,
  type Balances,
} from '@sweepdock/core/read-models';
import { boundedText, parseProviderJson } from './bounded-json';

const accountSchema = z.object({
  address: z.string(),
  balance: unitsSchema,
  is_scam: z.boolean().optional(),
});
const rowSchema = z.object({
  balance: unitsSchema,
  wallet_address: z.object({
    address: z.string(),
    is_scam: z.boolean(),
    is_wallet: z.boolean(),
  }),
  jetton: z.object({
    address: z.string(),
    name: z.string().max(2000),
    symbol: z.string().max(200),
    decimals: z.number().int().min(0).max(255),
    custom_payload_api_uri: z.string().optional(),
    scaled_ui: z.unknown().optional(),
  }),
  extensions: z.array(z.string()).max(20).optional(),
  lock: z.object({ amount: unitsSchema, till: z.number() }).optional(),
});
const pageSchema = z.object({ balances: z.array(rowSchema).max(100) });
type Options = {
  fetcher?: typeof fetch;
  signal?: AbortSignal;
  apiKey?: string;
  now?: () => number;
};

export async function readBalances(
  address: string,
  options: Options = {},
): Promise<Balances> {
  const canonical = normalizeMainnetAddress(address);
  if (options.signal?.aborted) throw new ReadError('CANCELLED');
  const signal = AbortSignal.any([
    AbortSignal.timeout(12000),
    ...(options.signal ? [options.signal] : []),
  ]);
  const fetcher = options.fetcher ?? fetch;
  async function get(path: string): Promise<unknown> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (options.apiKey) headers.Authorization = `Bearer ${options.apiKey}`;
    const response = await fetcher(
      `https://tonapi.io/v2/accounts/${canonical}${path}`,
      { signal, headers, redirect: 'error', cache: 'no-store' },
    );
    if (response.status === 429) throw new ReadError('RATE_LIMITED');
    if (!response.ok) throw new ReadError('PROVIDER_UNAVAILABLE');
    return parseProviderJson(await boundedText(response, 2_000_000));
  }
  try {
    const account = accountSchema.parse(await get(''));
    if (normalizeMainnetAddress(account.address) !== canonical)
      throw new ReadError('PROVIDER_INVALID_RESPONSE');
    const assets: Balances['assets'] = [];
    const seen = new Set<string>();
    let complete = false;
    let duplicates = false;
    for (let page = 0; page < 3; page++) {
      const { balances } = pageSchema.parse(
        await get(`/jettons?limit=100&offset=${page * 100}`),
      );
      for (const row of balances) {
        const master = normalizeMainnetAddress(row.jetton.address);
        if (seen.has(master)) {
          duplicates = true;
          continue;
        }
        seen.add(master);
        const known = reviewedAssets.find((asset) => asset.master === master);
        const reviewed = matchReviewedAsset(master, row.jetton.decimals);
        const unsupported =
          account.is_scam ||
          row.wallet_address.is_scam ||
          row.jetton.custom_payload_api_uri ||
          row.jetton.scaled_ui ||
          (row.extensions?.length ?? 0) > 0 ||
          (row.lock && BigInt(row.lock.amount) > 0n);
        const reason = !known
          ? 'UNREVIEWED'
          : !reviewed
            ? 'METADATA_MISMATCH'
            : unsupported
              ? 'UNSUPPORTED_TOKEN'
              : BigInt(row.balance) === 0n
                ? 'ZERO_BALANCE'
                : null;
        assets.push({
          master,
          symbol: known?.symbol ?? row.jetton.symbol.slice(0, 24),
          name: known?.name ?? row.jetton.name.slice(0, 80),
          decimals: row.jetton.decimals,
          units: row.balance,
          reviewedId: reviewed?.id ?? null,
          eligible: reason === null,
          reason,
        });
      }
      if (balances.length < 100) {
        complete = true;
        break;
      }
    }
    return balancesSchema.parse({
      network: 'ton-mainnet',
      readOnly: true,
      source: 'tonapi',
      address: canonical,
      observedAtMs: (options.now ?? Date.now)(),
      nativeBalanceUnits: account.balance,
      complete: complete && !duplicates,
      assets,
    });
  } catch (error) {
    if (options.signal?.aborted) throw new ReadError('CANCELLED');
    if (error instanceof ReadError) throw error;
    if (
      error instanceof z.ZodError ||
      error instanceof SyntaxError ||
      (error instanceof Error && error.message === 'Invalid mainnet address')
    )
      throw new ReadError('PROVIDER_INVALID_RESPONSE');
    throw new ReadError('PROVIDER_UNAVAILABLE');
  }
}
