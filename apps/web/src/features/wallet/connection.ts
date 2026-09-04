export type WalletAccount = { address: string; chain: string };
export type WalletSnapshot = { account: WalletAccount | null; error: boolean };
export interface ReadOnlyWalletSession {
  getSnapshot(): WalletSnapshot;
  subscribe(listener: () => void): () => void;
  openPicker(): Promise<void>;
  disconnect(): Promise<void>;
  resume(): void;
  pause(): void;
}
export function connectionState(
  account: WalletAccount | null,
):
  | { kind: 'disconnected' | 'wrong-network' | 'invalid'; address: null }
  | { kind: 'connected'; address: string } {
  if (!account) return { kind: 'disconnected', address: null };
  if (account.chain !== '-239') return { kind: 'wrong-network', address: null };
  if (!/^0:[a-fA-F0-9]{64}$/.test(account.address))
    return { kind: 'invalid', address: null };
  return { kind: 'connected', address: account.address.toLowerCase() };
}
export function manifestUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.hash ||
      !url.hostname.includes('.') ||
      url.hostname.includes(':') ||
      /^[\d.]+$/.test(url.hostname) ||
      /(^|\.)(localhost|local)$/.test(url.hostname)
    )
      return null;
    return url.href;
  } catch {
    return null;
  }
}
export function memoryStorage() {
  const values = new Map<string, string>();
  return {
    async getItem(key: string) {
      return values.get(key) ?? null;
    },
    async setItem(key: string, value: string) {
      values.set(key, value);
    },
    async removeItem(key: string) {
      values.delete(key);
    },
  };
}
