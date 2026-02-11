/**
 * Token encoding/decoding utilities for the Omni bridge.
 * Mirrors logic from @hot-labs/omni-sdk without pulling in the full package.
 *
 * Omni uses a custom token identifier format:
 *   nep245:v2_1.omni.hot.tg:{chainId}_{base58address}
 */

// --- Constants ---

export const OMNI_BRIDGE_CONTRACT = 'v2_1.omni.hot.tg';
export const INTENTS_CONTRACT = 'intents.near';
export const TREASURY_EVM = '0x233c5370CCfb3cD7409d9A3fb98ab94dE94Cb4Cd';

/** Known chain IDs used by the Omni bridge */
export const OMNI_CHAINS = {
  NEAR: 0,
  ETH: 1,
  ARB: 42161,
  BASE: 8453,
  BSC: 56,
  INK_SEPOLIA: 763373,
  TON: 1117,
  SOL: 501,
} as const;

/** Known token addresses on Ink Sepolia */
export const INK_TOKENS = {
  USDT0: '0x60f50f902b2e91aef7d6c700eb22599e297fa86f',
} as const;

/** Known token addresses on Base */
export const BASE_TOKENS = {
  USDC: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
} as const;

// --- Base58 (minimal implementation) ---

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function encodeBase58(bytes: Uint8Array): string {
  const digits: number[] = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  // Leading zeros
  let result = '';
  for (const byte of bytes) {
    if (byte !== 0) break;
    result += BASE58_ALPHABET[0];
  }
  for (let i = digits.length - 1; i >= 0; i--) {
    result += BASE58_ALPHABET[digits[i]];
  }
  return result;
}

function decodeBase58(str: string): Uint8Array {
  const bytes: number[] = [0];
  for (const char of str) {
    const value = BASE58_ALPHABET.indexOf(char);
    if (value < 0) throw new Error(`Invalid base58 character: ${char}`);
    let carry = value;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  // Leading '1's map to leading zero bytes
  for (const char of str) {
    if (char !== BASE58_ALPHABET[0]) break;
    bytes.push(0);
  }
  return new Uint8Array(bytes.reverse());
}

// --- Token Encoding ---

/**
 * Encode an EVM token address to Omni base58 format.
 * e.g. 0x60f5...86f → base58 string
 */
export function encodeTokenAddress(address: string): string {
  const bytes = hexToBytes(address);
  return encodeBase58(bytes);
}

/**
 * Decode an Omni base58 token address back to hex.
 * Returns 0x-prefixed lowercase hex.
 */
export function decodeTokenAddress(encoded: string): string {
  const bytes = decodeBase58(encoded);
  // EVM addresses are 20 bytes — pad if necessary
  const padded = new Uint8Array(20);
  padded.set(bytes.slice(Math.max(0, bytes.length - 20)), 20 - Math.min(bytes.length, 20));
  return '0x' + bytesToHex(padded);
}

/**
 * Build the full Omni NEP-245 token identifier.
 * Format: `nep245:v2_1.omni.hot.tg:{chainId}_{base58address}`
 */
export function toOmniIntent(chainId: number, tokenAddress: string): string {
  const base58 = encodeTokenAddress(tokenAddress);
  return `nep245:${OMNI_BRIDGE_CONTRACT}:${chainId}_${base58}`;
}

/**
 * Encode a receiver address for the Omni bridge contract.
 * For EVM chains: `{chainId}:{evmAddress}` (lowercase, no 0x prefix).
 */
export function encodeReceiver(chainId: number, evmAddress: string): string {
  const clean = evmAddress.toLowerCase().replace('0x', '');
  return `${chainId}:${clean}`;
}

/**
 * Parse an Omni token ID back to chain ID + token address.
 * Input format: `nep245:v2_1.omni.hot.tg:{chainId}_{base58}`
 */
export function parseOmniTokenId(tokenId: string): { chainId: number; address: string } | null {
  const match = tokenId.match(/^nep245:[^:]+:(\d+)_(.+)$/);
  if (!match) return null;
  return {
    chainId: parseInt(match[1], 10),
    address: decodeTokenAddress(match[2]),
  };
}

/** Pre-computed Omni intent ID for USDT0 on Ink Sepolia (NOT supported by 1Click) */
export const INK_USDT0_OMNI_ID = toOmniIntent(OMNI_CHAINS.INK_SEPOLIA, INK_TOKENS.USDT0);

/**
 * Defuse asset IDs used by 1Click API.
 * NOTE: 1Click supports these chains: near, eth, arb, base, bsc, op, avax, pol,
 *       ton, sol, tron, sui, gnosis, bera, monad, xlayer, plasma, starknet,
 *       stellar, aptos, btc, doge, xrp, ltc, bch, zec, cardano, adi.
 * Ink is NOT supported by 1Click.
 */
export const DEFUSE_ASSETS = {
  /** USDC on NEAR mainnet */
  NEAR_USDC: 'nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1',
  /** USDT on NEAR mainnet */
  NEAR_USDT: 'nep141:usdt.tether-token.near',
  /** USDC on Base (supported by 1Click) */
  BASE_USDC: 'nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near',
  /** USDT on Arbitrum (supported by 1Click) */
  ARB_USDT: 'nep141:arb-0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9.omft.near',
  /** USDC on Arbitrum (supported by 1Click) */
  ARB_USDC: 'nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near',
  /** USDT0 on Ink Sepolia via Omni bridge (NOT supported by 1Click!) */
  INK_USDT0: INK_USDT0_OMNI_ID,
} as const;
