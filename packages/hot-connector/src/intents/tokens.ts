export interface ChainInfo {
  chainId: string;
  chainName: string;
  icon: string;
  nativeSymbol: string;
  explorerUrl?: string;
}

export const SUPPORTED_CHAINS: ChainInfo[] = [
  { chainId: 'near', chainName: 'NEAR', icon: 'N', nativeSymbol: 'NEAR' },
  { chainId: 'eth', chainName: 'Ethereum', icon: 'E', nativeSymbol: 'ETH', explorerUrl: 'https://etherscan.io' },
  { chainId: 'arb', chainName: 'Arbitrum', icon: 'A', nativeSymbol: 'ETH', explorerUrl: 'https://arbiscan.io' },
  { chainId: 'base', chainName: 'Base', icon: 'B', nativeSymbol: 'ETH', explorerUrl: 'https://basescan.org' },
  { chainId: 'sol', chainName: 'Solana', icon: 'S', nativeSymbol: 'SOL', explorerUrl: 'https://solscan.io' },
  { chainId: 'bsc', chainName: 'BNB Chain', icon: 'BNB', nativeSymbol: 'BNB', explorerUrl: 'https://bscscan.com' },
  { chainId: 'ton', chainName: 'TON', icon: 'T', nativeSymbol: 'TON' },
];

export interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
}

export const SUPPORTED_TOKENS: TokenInfo[] = [
  { symbol: 'USDT', name: 'Tether USD', decimals: 6 },
  { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
];

/**
 * Mapping: `chain:symbol` → defuse asset ID (NEP-141 format)
 * Used by 1Click API for cross-chain routing.
 */
export const POPULAR_TOKENS: Record<string, string> = {
  // NEAR
  'near:USDT': 'nep141:usdt.tether-token.near',
  'near:USDC': 'nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1',

  // Ethereum
  'eth:USDT': 'nep141:eth-0xdac17f958d2ee523a2206206994597c13d831ec7.omft.near',
  'eth:USDC': 'nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near',

  // Arbitrum
  'arb:USDT': 'nep141:arb-0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9.omft.near',
  'arb:USDC': 'nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near',

  // Base
  'base:USDC': 'nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near',

  // Solana
  'sol:USDC': 'nep141:sol-5ce3bf3a31af18be40ba30f721101b4341690186.omft.near',

  // BNB Chain
  'bsc:USDT': 'nep141:bsc-0x55d398326f99059ff775485246999027b3197955.omft.near',
  'bsc:USDC': 'nep141:bsc-0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d.omft.near',

  // TON
  'ton:USDT': 'nep245:v2_1.omni.hot.tg:1117_3tsdfyziyc7EJbP2aULWSKU4toBaAcN4FdTgfm5W1mC4ouR',
};

/** Get defuse asset ID for a chain:token pair */
export function getAssetId(chain: string, symbol: string): string | null {
  return POPULAR_TOKENS[`${chain}:${symbol}`] ?? null;
}

/** Get available tokens for a given chain */
export function getTokensForChain(chain: string): TokenInfo[] {
  return SUPPORTED_TOKENS.filter(
    (t) => POPULAR_TOKENS[`${chain}:${t.symbol}`] != null
  );
}
