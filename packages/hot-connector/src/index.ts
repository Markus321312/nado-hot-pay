// Core
export { hotWalletConnector } from './connector';
export { detectHotEnvironment, detectHotSync, isInsideHotWallet } from './detectEnvironment';

// React hooks
export { useHotWallet } from './useHotWallet';
export { useHotDeposit } from './useHotDeposit';
export { useIntentsBridge } from './useIntentsBridge';
export { useHotPayFlow } from './useHotPayFlow';

// React components
export { HotPayButton } from './HotPayButton';
export { HotDepositWidget } from './HotDepositWidget';
export { HotBridgeWidget } from './HotBridgeWidget';
export { IntentsBridgeWidget } from './IntentsBridgeWidget';
export { HotPayFlowWidget } from './HotPayFlowWidget';

// Intents / Bridge API
export { fetchSupportedTokens, getQuote, getSwapStatus, submitDepositTx } from './intents/oneClickApi';
export { SUPPORTED_CHAINS, POPULAR_TOKENS, getAssetId, getTokensForChain } from './intents/tokens';

// Omni Bridge API
export {
  fetchIntentTokens,
  processDeposit,
  publishIntent,
  signWithdrawal,
  getWithdrawals,
  getPendingDeposit,
} from './omni/omniApi';
export {
  OMNI_BRIDGE_CONTRACT,
  INTENTS_CONTRACT,
  TREASURY_EVM,
  OMNI_CHAINS,
  INK_TOKENS,
  DEFUSE_ASSETS,
  toOmniIntent,
  encodeTokenAddress,
  decodeTokenAddress,
  encodeReceiver,
  parseOmniTokenId,
  INK_USDT0_OMNI_ID,
} from './omni/omniTokens';

// NEAR Signing
export {
  createNearAccount,
  ftTransferCall,
  ftBalance,
  ensureStorageDeposit,
  NEAR_USDC_CONTRACT,
  NEAR_USDT_CONTRACT,
} from './omni/nearSigner';

// Types
export type { HotConnectorOptions, HotPayConfig, HotConnectionState, HotEnvironment } from './types';
export type { HotDepositStep } from './useHotDeposit';
export type { BridgeStep, BridgeQuote, UseIntentsBridgeOptions } from './useIntentsBridge';
export type { FlowStep, HotPayFlowOptions, FlowTxHashes } from './useHotPayFlow';
export type { OneClickToken, QuoteRequest, QuoteResponse, SwapStatus } from './intents/oneClickApi';
export type {
  OmniIntentToken,
  DepositParams,
  DepositResult,
  WithdrawalIntent,
  IntentSolverResponse,
  WithdrawalSignature,
  PendingWithdrawal,
  PendingDeposit,
} from './omni/omniApi';
export type { NearSignerConfig } from './omni/nearSigner';
export type { ChainInfo, TokenInfo } from './intents/tokens';

// Shield Escrow
export {
  // Contract RPC
  getEscrow,
  getEscrowCount,
  getAdmin,
  getEscrowsByBuyer,
  getEscrowsBySeller,
  confirmDelivery,
  claimTimeoutRefund,
  openDispute,
  resolveDispute,
  // Hooks
  useEscrowPayment,
  useEscrowStatus,
  // Components
  EscrowCheckout,
  EscrowTimeline,
  MerchantDashboard,
} from './escrow';
export type {
  Escrow,
  EscrowStatus,
  EscrowStep,
  EscrowPaymentOptions,
  EscrowSession,
  EscrowTransferMsg,
  EscrowCheckoutProps,
  EscrowTimelineProps,
  MerchantDashboardProps,
  UseEscrowStatusOptions,
} from './escrow';
