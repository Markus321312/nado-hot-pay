import { useState, useEffect, useCallback } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { HOT } from '@hot-wallet/sdk';
import { detectHotEnvironment } from './detectEnvironment';
import type { HotEnvironment, HotConnectionState } from './types';

export function useHotWallet() {
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const [environment, setEnvironment] = useState<HotEnvironment | null>(null);
  const [hotState, setHotState] = useState<HotConnectionState | null>(null);
  const [isAutoConnecting, setIsAutoConnecting] = useState(false);

  // Detect environment on mount
  useEffect(() => {
    detectHotEnvironment().then(setEnvironment);
  }, []);

  // Load HOT connection state (provides NEAR/Solana/TON addresses)
  useEffect(() => {
    HOT.connection.then((state) => {
      if (state) setHotState(state as HotConnectionState);
    });
  }, []);

  // Auto-connect when inside HOT Wallet
  useEffect(() => {
    if (!environment?.isInsideHot) return;
    if (isConnected) return;
    if (isAutoConnecting) return;

    const hotConnector = connectors.find(
      (c) => c.id === 'hot-wallet' || c.name === 'HOT Wallet'
    );
    if (!hotConnector) return;

    setIsAutoConnecting(true);
    connect(
      { connector: hotConnector },
      { onSettled: () => setIsAutoConnecting(false) },
    );
  }, [environment, isConnected, isAutoConnecting, connectors, connect]);

  const isHotConnected = isConnected && (
    connector?.id === 'hot-wallet' ||
    connector?.name === 'HOT Wallet' ||
    (connector as any)?.rdns === 'org.hot-labs'
  );

  const connectHot = useCallback(() => {
    const hotConnector = connectors.find(
      (c) => c.id === 'hot-wallet' || c.name === 'HOT Wallet'
    );
    if (hotConnector) {
      connect({ connector: hotConnector });
    }
  }, [connectors, connect]);

  return {
    /** Detected environment (null while detecting) */
    environment,
    /** Full HOT connection state (NEAR, Solana, TON, EVM) */
    hotState,
    /** True if connected specifically through HOT Wallet */
    isHotConnected,
    /** True while auto-connecting in HOT environment */
    isAutoConnecting,
    /** NEAR address from HOT (null if not available) */
    nearAddress: hotState?.near?.address ?? null,
    /** EVM address (from wagmi or HOT state) */
    evmAddress: address ?? hotState?.evm?.address ?? null,
    /** Telegram user ID (null if not in Telegram) */
    telegramId: hotState?.telegramId ?? null,
    /** Manually trigger HOT Wallet connection */
    connectHot,
    /** Disconnect current wallet */
    disconnect,
  };
}
