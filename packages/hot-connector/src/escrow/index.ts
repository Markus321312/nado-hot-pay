// Shield Escrow module exports

// Types
export type {
  Escrow,
  EscrowStatus,
  EscrowStep,
  EscrowPaymentOptions,
  EscrowSession,
  EscrowTransferMsg,
} from './escrowTypes';

// Contract RPC
export {
  getEscrow,
  getEscrowCount,
  getAdmin,
  getEscrowsByBuyer,
  getEscrowsBySeller,
  confirmDelivery,
  claimTimeoutRefund,
  openDispute,
  resolveDispute,
} from './escrowContract';

// React hooks
export { useEscrowPayment } from './useEscrowPayment';
export { useEscrowStatus } from './useEscrowStatus';
export type { UseEscrowStatusOptions } from './useEscrowStatus';

// React components
export { EscrowCheckout } from './EscrowCheckout';
export type { EscrowCheckoutProps } from './EscrowCheckout';
export { EscrowTimeline } from './EscrowTimeline';
export type { EscrowTimelineProps } from './EscrowTimeline';
export { MerchantDashboard } from './MerchantDashboard';
export type { MerchantDashboardProps } from './MerchantDashboard';
