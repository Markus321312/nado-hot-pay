import React from 'react';
import { useHotWallet } from './useHotWallet';

export interface HotBridgeWidgetProps {
  className?: string;
  style?: React.CSSProperties;
}

const s: Record<string, React.CSSProperties> = {
  container: {
    background: '#1c1c1e',
    borderRadius: '12px',
    padding: '20px',
    maxWidth: '400px',
    width: '100%',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#fff',
  },
  title: {
    fontSize: '16px',
    fontWeight: 700,
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  badge: {
    fontSize: '9px',
    fontWeight: 700,
    padding: '2px 6px',
    background: 'rgba(255, 140, 0, 0.15)',
    color: '#ff8c00',
    borderRadius: '4px',
    textTransform: 'uppercase' as const,
  },
  flow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  chainBox: {
    flex: 1,
    padding: '12px',
    background: '#2c2c2e',
    borderRadius: '10px',
    textAlign: 'center' as const,
  },
  chainName: {
    fontSize: '13px',
    fontWeight: 700,
    marginBottom: '4px',
  },
  chainAddr: {
    fontSize: '10px',
    color: '#8e8e93',
    fontFamily: 'monospace',
    wordBreak: 'break-all' as const,
  },
  arrow: {
    fontSize: '20px',
    color: '#ff8c00',
    flexShrink: 0,
  },
  bridge: {
    textAlign: 'center' as const,
    padding: '12px',
    background: 'rgba(255, 140, 0, 0.06)',
    border: '1px solid rgba(255, 140, 0, 0.15)',
    borderRadius: '10px',
    marginBottom: '12px',
  },
  bridgeTitle: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#ff8c00',
    marginBottom: '4px',
  },
  bridgeDesc: {
    fontSize: '11px',
    color: '#8e8e93',
  },
  chains: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '6px',
    justifyContent: 'center',
  },
  chainTag: {
    fontSize: '10px',
    padding: '3px 8px',
    background: '#2c2c2e',
    borderRadius: '6px',
    color: '#8e8e93',
  },
  activeChainTag: {
    fontSize: '10px',
    padding: '3px 8px',
    background: 'rgba(255, 140, 0, 0.1)',
    borderRadius: '6px',
    color: '#ff8c00',
    fontWeight: 600,
  },
  info: {
    fontSize: '11px',
    color: '#8e8e93',
    textAlign: 'center' as const,
    marginTop: '12px',
  },
};

function shortenAddr(addr: string): string {
  if (addr.length <= 16) return addr;
  return addr.slice(0, 8) + '...' + addr.slice(-6);
}

export function HotBridgeWidget({ className, style }: HotBridgeWidgetProps) {
  const { isHotConnected, nearAddress, evmAddress, hotState } = useHotWallet();

  const supportedChains = [
    { name: 'NEAR', active: !!nearAddress },
    { name: 'Ethereum', active: true },
    { name: 'Solana', active: !!hotState?.solana?.address },
    { name: 'TON', active: !!hotState?.ton?.address },
    { name: 'BNB', active: false },
    { name: 'Polygon', active: false },
    { name: 'Arbitrum', active: false },
    { name: 'Base', active: false },
  ];

  return (
    <div className={className} style={{ ...s.container, ...style }}>
      <div style={s.title}>
        Cross-Chain Bridge
        <span style={s.badge}>HOT Protocol</span>
      </div>

      {/* Source -> Bridge -> Target flow */}
      <div style={s.flow}>
        <div style={s.chainBox}>
          <div style={s.chainName}>Source Chain</div>
          <div style={s.chainAddr}>
            {nearAddress ? shortenAddr(nearAddress) : 'Any chain'}
          </div>
        </div>
        <div style={s.arrow}>→</div>
        <div style={s.chainBox}>
          <div style={s.chainName}>Ink Sepolia</div>
          <div style={s.chainAddr}>
            {evmAddress ? shortenAddr(evmAddress) : 'Not connected'}
          </div>
        </div>
      </div>

      {/* HOT Bridge */}
      <div style={s.bridge}>
        <div style={s.bridgeTitle}>HOT Protocol MPC Bridge</div>
        <div style={s.bridgeDesc}>
          Powered by NEAR Chain Signatures. Decentralized MPC signer with 100+ chain support.
        </div>
      </div>

      {/* Supported chains */}
      <div style={s.chains}>
        {supportedChains.map((chain) => (
          <span key={chain.name} style={chain.active ? s.activeChainTag : s.chainTag}>
            {chain.name}
          </span>
        ))}
      </div>

      <div style={s.info}>
        {isHotConnected
          ? `Connected via HOT | NEAR: ${nearAddress ? shortenAddr(nearAddress) : 'N/A'}`
          : 'Connect HOT Wallet to enable cross-chain deposits'}
      </div>
    </div>
  );
}
