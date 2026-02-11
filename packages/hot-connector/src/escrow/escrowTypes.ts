/**
 * Types for the HOT Pay Shield escrow protocol.
 */

export type EscrowStatus =
  | 'funded'
  | 'confirmed'
  | 'disputed'
  | 'refunded'
  | 'released';

export interface Escrow {
  id: string;
  buyer: string;
  seller: string;
  token_contract: string;
  amount: string;
  status: EscrowStatus;
  created_at: string;      // block timestamp in nanoseconds
  timeout_at: string;       // auto-refund deadline in nanoseconds
  description: string;
  dispute_reason: string | null;
}

export type EscrowStep =
  | 'idle'
  | 'paying'       // user is in HOT Pay
  | 'escrowed'     // funds are in escrow, waiting for confirmation
  | 'confirming'   // buyer is confirming delivery
  | 'released'     // funds released to seller
  | 'refunding'    // claiming timeout refund
  | 'refunded'     // funds refunded to buyer
  | 'disputed'     // dispute opened
  | 'error';

export interface EscrowPaymentOptions {
  /** Escrow contract account on NEAR */
  escrowContract: string;
  /** Merchant NEAR account (seller) */
  sellerAccount: string;
  /** HOT Pay link URL */
  hotPayLink: string;
  /** Buyer NEAR account + key (for confirm/dispute signing) */
  buyerNearAccount?: string;
  buyerNearKey?: string;
  /** Description of the purchase */
  description?: string;
  /** Timeout in minutes (default 1440 = 24h) */
  timeoutMinutes?: number;
  /** Amount in human-readable units (e.g. "1" for 1 USDC) */
  amount?: string;
  /** Token symbol */
  tokenSymbol?: string;
}

export interface EscrowSession {
  escrowId: string | null;
  escrowCountBefore: number;
  timestamp: number;
}

/** ft_on_transfer msg JSON that buyer embeds in the HOT Pay transfer */
export interface EscrowTransferMsg {
  seller: string;
  description: string;
  timeout_minutes: number;
}
