/**
 * NEAR RPC calls to the Shield Escrow smart contract.
 * View calls use direct RPC (no signing needed).
 * Change calls use near-api-js Account for signing.
 */

import { Account } from 'near-api-js';
import type { Escrow } from './escrowTypes';

const NEAR_RPC = 'https://rpc.mainnet.near.org';

// Default gas for change methods
const CHANGE_GAS = BigInt('100000000000000'); // 100 TGas
const ONE_YOCTO = BigInt('1');

// ─── View calls (no signing) ───

async function viewCall<T>(
  contractId: string,
  methodName: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const argsBase64 = btoa(JSON.stringify(args));
  const res = await fetch(NEAR_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'shield',
      method: 'query',
      params: {
        request_type: 'call_function',
        finality: 'final',
        account_id: contractId,
        method_name: methodName,
        args_base64: argsBase64,
      },
    }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || JSON.stringify(json.error));
  const resultBytes = json.result?.result;
  if (!resultBytes) return null as T;
  const text = new TextDecoder().decode(new Uint8Array(resultBytes));
  return JSON.parse(text) as T;
}

/** Get a single escrow by ID */
export async function getEscrow(
  contractId: string,
  escrowId: string,
): Promise<Escrow | null> {
  return viewCall<Escrow | null>(contractId, 'get_escrow', { escrow_id: escrowId });
}

/** Get total escrow count */
export async function getEscrowCount(contractId: string): Promise<number> {
  return viewCall<number>(contractId, 'get_escrow_count');
}

/** Get contract admin */
export async function getAdmin(contractId: string): Promise<string> {
  return viewCall<string>(contractId, 'get_admin');
}

/** Get escrows where buyer matches */
export async function getEscrowsByBuyer(
  contractId: string,
  buyer: string,
  fromIndex = 0,
  limit = 20,
): Promise<Escrow[]> {
  return viewCall<Escrow[]>(contractId, 'get_escrows_by_buyer', {
    buyer,
    from_index: fromIndex,
    limit,
  });
}

/** Get escrows where seller matches */
export async function getEscrowsBySeller(
  contractId: string,
  seller: string,
  fromIndex = 0,
  limit = 20,
): Promise<Escrow[]> {
  return viewCall<Escrow[]>(contractId, 'get_escrows_by_seller', {
    seller,
    from_index: fromIndex,
    limit,
  });
}

// ─── Change calls (require signing) ───

/** Buyer confirms delivery → funds released to seller */
export async function confirmDelivery(
  account: Account,
  contractId: string,
  escrowId: string,
): Promise<{ hash: string }> {
  const result = await account.callFunctionRaw({
    contractId,
    methodName: 'confirm_delivery',
    args: { escrow_id: escrowId },
    gas: CHANGE_GAS,
    deposit: ONE_YOCTO,
  });
  const hash =
    (result as any)?.transaction?.hash ??
    (result as any)?.transaction_outcome?.id ??
    'submitted';
  return { hash };
}

/** Anyone can call if timeout passed → refunds buyer */
export async function claimTimeoutRefund(
  account: Account,
  contractId: string,
  escrowId: string,
): Promise<{ hash: string }> {
  const result = await account.callFunctionRaw({
    contractId,
    methodName: 'claim_timeout_refund',
    args: { escrow_id: escrowId },
    gas: CHANGE_GAS,
    deposit: ONE_YOCTO,
  });
  const hash =
    (result as any)?.transaction?.hash ??
    (result as any)?.transaction_outcome?.id ??
    'submitted';
  return { hash };
}

/** Buyer opens a dispute */
export async function openDispute(
  account: Account,
  contractId: string,
  escrowId: string,
  reason: string,
): Promise<{ hash: string }> {
  const result = await account.callFunctionRaw({
    contractId,
    methodName: 'open_dispute',
    args: { escrow_id: escrowId, reason },
    gas: CHANGE_GAS,
    deposit: ONE_YOCTO,
  });
  const hash =
    (result as any)?.transaction?.hash ??
    (result as any)?.transaction_outcome?.id ??
    'submitted';
  return { hash };
}

/** Admin resolves a dispute */
export async function resolveDispute(
  account: Account,
  contractId: string,
  escrowId: string,
  releaseToSeller: boolean,
): Promise<{ hash: string }> {
  const result = await account.callFunctionRaw({
    contractId,
    methodName: 'resolve_dispute',
    args: { escrow_id: escrowId, release_to_seller: releaseToSeller },
    gas: CHANGE_GAS,
    deposit: ONE_YOCTO,
  });
  const hash =
    (result as any)?.transaction?.hash ??
    (result as any)?.transaction_outcome?.id ??
    'submitted';
  return { hash };
}
