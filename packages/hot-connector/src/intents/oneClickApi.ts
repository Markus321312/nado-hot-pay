const BASE_URL = 'https://1click.chaindefuser.com';

// --- Types ---

export interface OneClickToken {
  defuse_asset_id: string;
  blockchain: string;
  chain_name: string;
  address?: string;
  symbol: string;
  decimals: number;
  asset_name?: string;
  icon?: string;
  routes_to?: string[];
  routes_from?: string[];
}

export interface QuoteRequest {
  dry?: boolean;
  swapType: 'EXACT_INPUT' | 'EXACT_OUTPUT';
  slippageTolerance: number;
  originAsset: string;
  destinationAsset: string;
  amount: string;
  depositType: 'ORIGIN_CHAIN' | 'INTENTS';
  refundTo: string;
  refundType: 'ORIGIN_CHAIN' | 'INTENTS';
  recipient: string;
  recipientType: 'DESTINATION_CHAIN' | 'INTENTS';
  deadline?: string;
}

export interface QuoteResponse {
  depositAddress: string;
  amountIn: string;
  amountOut: string;
  amountOutUsd?: string;
  minAmountOut: string;
  timeEstimateMs?: number;
  expirationTime?: string;
}

export type SwapStatus =
  | 'PENDING_DEPOSIT'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'INCOMPLETE_DEPOSIT'
  | 'REFUNDED'
  | 'FAILED';

export interface StatusResponse {
  status: SwapStatus;
  amountOut?: string;
  destinationTxHashes?: string[];
}

// --- API Functions ---

export async function fetchSupportedTokens(): Promise<OneClickToken[]> {
  const res = await fetch(`${BASE_URL}/v0/tokens`);
  if (!res.ok) throw new Error(`Failed to fetch tokens: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : data.tokens ?? [];
}

export async function getQuote(params: QuoteRequest): Promise<QuoteResponse> {
  const deadline = params.deadline ?? new Date(Date.now() + 30 * 60 * 1000).toISOString();

  const body: Record<string, unknown> = {
    swapType: params.swapType,
    slippageTolerance: params.slippageTolerance,
    originAsset: params.originAsset,
    destinationAsset: params.destinationAsset,
    amount: params.amount,
    depositType: params.depositType,
    refundTo: params.refundTo,
    refundType: params.refundType,
    recipient: params.recipient,
    recipientType: params.recipientType,
    deadline,
  };

  body.dry = params.dry === true;

  const res = await fetch(`${BASE_URL}/v0/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Quote failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return {
    depositAddress: data.depositAddress ?? data.deposit_address ?? '',
    amountIn: data.amountIn ?? data.amount_in ?? params.amount,
    amountOut: data.amountOut ?? data.amount_out ?? '0',
    amountOutUsd: data.amountOutUsd ?? data.amount_out_usd,
    minAmountOut: data.minAmountOut ?? data.min_amount_out ?? '0',
    timeEstimateMs: data.timeEstimateMs ?? data.time_estimate_ms,
    expirationTime: data.expirationTime ?? data.expiration_time,
  };
}

export async function getSwapStatus(depositAddress: string): Promise<StatusResponse> {
  const res = await fetch(
    `${BASE_URL}/v0/status?depositAddress=${encodeURIComponent(depositAddress)}`
  );
  if (!res.ok) throw new Error(`Status check failed: ${res.status}`);
  const data = await res.json();
  return {
    status: data.status,
    amountOut: data.amount_out,
    destinationTxHashes: data.destination_tx_hashes,
  };
}

export async function submitDepositTx(
  txHash: string,
  depositAddress: string,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/v0/deposit/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tx_hash: txHash,
      deposit_address: depositAddress,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Deposit submit failed (${res.status}): ${text.slice(0, 200)}`);
  }
}
