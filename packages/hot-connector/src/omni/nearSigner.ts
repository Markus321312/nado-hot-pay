/**
 * NEAR transaction signing for Omni bridge claims.
 * Uses near-api-js v7 to sign and submit ft_transfer_call transactions.
 */

import { Account } from 'near-api-js';
import type { KeyPairString } from 'near-api-js';

const NEAR_RPC = 'https://rpc.mainnet.near.org';

/** USDC token contract on NEAR mainnet */
export const NEAR_USDC_CONTRACT = '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1';

/** USDT token contract on NEAR mainnet */
export const NEAR_USDT_CONTRACT = 'usdt.tether-token.near';

/** Default gas for ft_transfer_call (100 TGas) */
const FT_TRANSFER_GAS = BigInt('100000000000000');

/** 1 yoctoNEAR — required deposit for ft_transfer */
const ONE_YOCTO = BigInt('1');

export interface NearSignerConfig {
  accountId: string;
  privateKey: string;
  nodeUrl?: string;
}

/**
 * Create a NEAR Account instance from private key (near-api-js v7).
 * The Account constructor takes (accountId, provider, signer).
 */
export function createNearAccount(config: NearSignerConfig): Account {
  const { accountId, privateKey, nodeUrl = NEAR_RPC } = config;

  // Support both raw base58 key and ed25519: prefixed key
  const keyString = (privateKey.startsWith('ed25519:') ? privateKey : `ed25519:${privateKey}`) as KeyPairString;

  // In v7, Account constructor: (accountId, provider | rpcUrl, signer | keyPairString)
  return new Account(accountId, nodeUrl, keyString);
}

/**
 * Execute ft_transfer_call: send NEP-141 tokens to a receiver with a message.
 * Used for depositing USDC into the 1Click deposit address or Omni bridge.
 */
export async function ftTransferCall(
  account: Account,
  tokenContract: string,
  receiverId: string,
  amount: string,
  msg: string = '',
): Promise<{ hash: string }> {
  const result = await account.callFunctionRaw({
    contractId: tokenContract,
    methodName: 'ft_transfer_call',
    args: {
      receiver_id: receiverId,
      amount,
      msg,
    },
    gas: FT_TRANSFER_GAS,
    deposit: ONE_YOCTO,
  });

  // Extract tx hash from v7 result
  const hash = (result as any)?.transaction?.hash
    ?? (result as any)?.transaction_outcome?.id
    ?? 'submitted';

  return { hash };
}

/**
 * Check ft balance for an account on a given token contract.
 * Uses view call (no signing needed).
 */
export async function ftBalance(
  account: Account,
  tokenContract: string,
): Promise<string> {
  const result = await account.callFunction<string>({
    contractId: tokenContract,
    methodName: 'ft_balance_of',
    args: { account_id: account.accountId },
  });
  return result;
}

/**
 * Ensure storage is registered for the account on a token contract.
 * Required before ft_transfer_call on some contracts.
 */
export async function ensureStorageDeposit(
  account: Account,
  contractId: string,
): Promise<void> {
  // Check if already registered
  try {
    const balance = await account.callFunction({
      contractId,
      methodName: 'storage_balance_of',
      args: { account_id: account.accountId },
    });
    if (balance) return; // Already registered
  } catch {
    // Not registered, continue to deposit
  }

  await account.callFunctionRaw({
    contractId,
    methodName: 'storage_deposit',
    args: { account_id: account.accountId },
    gas: BigInt('30000000000000'),
    deposit: BigInt('1250000000000000000000'), // 0.00125 NEAR typical minimum
  });
}
