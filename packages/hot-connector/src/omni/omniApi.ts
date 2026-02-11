/**
 * Lightweight wrapper for Omni bridge APIs (HOT DAO / HERE Wallet infra).
 * Replaces the heavy @hot-labs/omni-sdk (~15 MB) with direct fetch calls.
 */

const HERE_API = 'https://api0.herewallet.app/api/v1';
const HOT_RPC = 'https://rpc1.hotdao.ai';

// --- Types ---

export interface OmniIntentToken {
  token_id: string;
  chain_id: number;
  symbol: string;
  decimals: number;
  address: string;
  icon?: string;
}

export interface DepositParams {
  chain: string;
  token: string;
  amount: string;
  receiver_id: string;
  msg?: string;
}

export interface DepositResult {
  signature: string;
  deposit_id: string;
  nonce: string;
}

export interface WithdrawalIntent {
  token_id: string;
  amount: string;
  chain_id: number;
  receiver: string;
}

export interface IntentSolverResponse {
  intent_id: string;
  status: string;
  estimated_time_ms?: number;
}

export interface WithdrawalSignature {
  nonce: string;
  token: string;
  receiver: string;
  amount: string;
  signature: string;
}

export interface PendingWithdrawal {
  nonce: string;
  token: string;
  receiver: string;
  amount: string;
  chain_id: number;
  status: 'pending' | 'signed' | 'claimed' | 'expired';
}

export interface PendingDeposit {
  deposit_id: string;
  chain: string;
  tx_hash: string;
  amount: string;
  status: 'pending' | 'confirmed' | 'credited' | 'failed';
}

// --- API Functions ---

/** Fetch list of tokens available for Omni bridging */
export async function fetchIntentTokens(): Promise<OmniIntentToken[]> {
  const res = await fetch(`${HERE_API}/exchange/intent_tokens`);
  if (!res.ok) throw new Error(`Failed to fetch intent tokens: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : data.tokens ?? [];
}

/** Register a deposit intent with the Omni bridge (NEAR side) */
export async function processDeposit(params: DepositParams): Promise<DepositResult> {
  const res = await fetch(`${HERE_API}/transactions/process_bridge_deposit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Deposit processing failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json();
}

/** Publish a withdrawal intent to the Omni solver network */
export async function publishIntent(intent: WithdrawalIntent): Promise<IntentSolverResponse> {
  const res = await fetch(`${HERE_API}/evm/intent-solver`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(intent),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Intent publish failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json();
}

/** Get MPC signature for EVM withdrawal */
export async function signWithdrawal(nonce: string): Promise<WithdrawalSignature> {
  const res = await fetch(`${HOT_RPC}/withdraw/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nonce }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Withdrawal signing failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json();
}

/** Check pending withdrawals for a receiver on a given chain */
export async function getWithdrawals(
  receiver: string,
  chainId: number,
): Promise<PendingWithdrawal[]> {
  const res = await fetch(
    `${HOT_RPC}/withdraw/pending?receiver=${encodeURIComponent(receiver)}&chain_id=${chainId}`
  );
  if (!res.ok) throw new Error(`Withdrawals fetch failed: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : data.withdrawals ?? [];
}

/** Check deposit status by chain + tx hash */
export async function getPendingDeposit(
  chain: string,
  txHash: string,
): Promise<PendingDeposit | null> {
  const res = await fetch(
    `${HERE_API}/transactions/deposit_status?chain=${encodeURIComponent(chain)}&tx_hash=${encodeURIComponent(txHash)}`
  );
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Deposit status check failed: ${res.status}`);
  }
  return res.json();
}
