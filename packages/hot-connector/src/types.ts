/** Options for the HOT Wallet wagmi connector */
export interface HotConnectorOptions {
  /** RPC URL for read-only calls (eth_call, eth_getBalance, etc.) */
  rpcUrl?: string;
  /** Auto-connect when inside HOT Wallet environment (default: true) */
  autoConnect?: boolean;
  /** Target chain ID (default: 763373 for Ink Sepolia) */
  chainId?: number;
}

/** Configuration for HOT Pay deposit flow */
export interface HotPayConfig {
  /** ERC20 token address for deposit */
  tokenAddress?: `0x${string}`;
  /** NADO Endpoint contract address */
  endpointAddress?: `0x${string}`;
  /** Subaccount name as bytes12 hex */
  subaccountName?: `0x${string}`;
  /** Token decimals (default: 6 for USDT0) */
  tokenDecimals?: number;
}

/** HOT connection state from the SDK */
export interface HotConnectionState {
  telegramId: number;
  solana: { address: string; publicKey: string };
  ton: { address: string; publicKey: string };
  near: { address: string; publicKey: string };
  evm: { address: string; publicKey: string };
}

/** Environment detection result */
export interface HotEnvironment {
  /** True if running inside HOT Wallet (Telegram iframe or extension) */
  isInsideHot: boolean;
  /** True if running inside any Telegram WebApp */
  isTelegram: boolean;
  /** True if HOT browser extension is installed */
  hasHotExtension: boolean;
  /** Connection state */
  connectionState: 'pending' | 'connected' | 'disconnected';
}
