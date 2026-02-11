import React, { useState } from 'react';
import { useHotWallet } from './useHotWallet';
import { useHotDeposit } from './useHotDeposit';
import { HotPayButton } from './HotPayButton';
import type { HotPayConfig } from './types';

export interface HotDepositWidgetProps {
  /** Called when deposit succeeds */
  onSuccess?: () => void;
  /** Contract configuration override */
  config?: HotPayConfig;
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
    letterSpacing: '0.5px',
  },
  balanceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    color: '#8e8e93',
    marginBottom: '12px',
  },
  inputWrap: {
    position: 'relative' as const,
    marginBottom: '12px',
  },
  input: {
    width: '100%',
    padding: '12px 70px 12px 12px',
    background: '#2c2c2e',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    fontVariantNumeric: 'tabular-nums',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  suffix: {
    position: 'absolute' as const,
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#8e8e93',
    fontSize: '13px',
    fontWeight: 600,
  },
  maxBtn: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#ff8c00',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  mintBtn: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#0a84ff',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    marginRight: '8px',
  },
  depositBtn: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #ff8c00, #ff6b00)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  status: {
    textAlign: 'center' as const,
    padding: '24px 0',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid rgba(255,140,0,0.2)',
    borderTopColor: '#ff8c00',
    borderRadius: '50%',
    animation: 'hot-spin 0.8s linear infinite',
    margin: '0 auto 12px',
  },
  successText: { color: '#30d158', fontSize: '15px', fontWeight: 600 },
  errorText: { color: '#ff453a', fontSize: '14px', marginBottom: '12px' },
  retryBtn: {
    padding: '8px 20px',
    background: '#2c2c2e',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    cursor: 'pointer',
    marginTop: '12px',
  },
  info: {
    fontSize: '11px',
    color: '#8e8e93',
    textAlign: 'center' as const,
    marginTop: '8px',
  },
};

export function HotDepositWidget({ onSuccess, config: payConfig, className, style }: HotDepositWidgetProps) {
  const { isHotConnected } = useHotWallet();
  const { step, error, lastAction, balance, deposit, mint, reset } = useHotDeposit(payConfig);
  const [amount, setAmount] = useState('');

  // Not connected — show connect button
  if (!isHotConnected) {
    return (
      <div className={className} style={{ ...s.container, ...style }}>
        <div style={s.title}>
          Deposit via HOT
          <span style={s.badge}>NEAR</span>
        </div>
        <HotPayButton label="Connect HOT to Deposit" />
      </div>
    );
  }

  // Processing states
  if (step === 'minting' || step === 'approving' || step === 'depositing') {
    const labels: Record<string, string> = {
      minting: 'Minting test USDT0...',
      approving: 'Approving USDT0...',
      depositing: 'Depositing to NADO...',
    };
    return (
      <div className={className} style={{ ...s.container, ...style }}>
        <div style={s.status}>
          <div style={s.spinner} />
          <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>{labels[step]}</div>
          <div style={{ color: '#8e8e93', fontSize: '12px', marginTop: '4px' }}>
            Confirm in your HOT Wallet
          </div>
        </div>
      </div>
    );
  }

  // Success
  if (step === 'success') {
    return (
      <div className={className} style={{ ...s.container, ...style }}>
        <div style={s.status}>
          <div style={s.successText}>
            {lastAction === 'mint' ? 'Minted 100 USDT0!' : 'Deposit successful!'}
          </div>
          <div style={{ color: '#8e8e93', fontSize: '12px', marginTop: '4px' }}>
            {lastAction === 'mint'
              ? 'Test tokens added via HOT Wallet'
              : `${amount} USDT0 deposited to NADO`}
          </div>
          <button style={s.retryBtn} onClick={() => { reset(); onSuccess?.(); }}>
            {lastAction === 'mint' ? 'Continue' : 'Done'}
          </button>
        </div>
      </div>
    );
  }

  // Error
  if (step === 'error') {
    return (
      <div className={className} style={{ ...s.container, ...style }}>
        <div style={s.status}>
          <div style={s.errorText}>{error}</div>
          <button style={s.retryBtn} onClick={reset}>Try Again</button>
        </div>
      </div>
    );
  }

  // Default: input form
  return (
    <div className={className} style={{ ...s.container, ...style }}>
      <div style={s.title}>
        Deposit via HOT
        <span style={s.badge}>NEAR</span>
      </div>

      <div style={s.balanceRow}>
        <span>Balance: {balance} USDT0</span>
        <div>
          <button style={s.mintBtn} onClick={() => mint()}>Mint 100</button>
          <button style={s.maxBtn} onClick={() => setAmount(balance)}>MAX</button>
        </div>
      </div>

      <div style={s.inputWrap}>
        <input
          type="number"
          style={s.input}
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0"
          step="0.01"
        />
        <span style={s.suffix}>USDT0</span>
      </div>

      <button
        style={{ ...s.depositBtn, ...(!amount || parseFloat(amount) <= 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}) }}
        onClick={() => deposit(amount)}
        disabled={!amount || parseFloat(amount) <= 0}
      >
        Deposit to NADO
      </button>

      <div style={s.info}>Powered by HOT Protocol on NEAR</div>
    </div>
  );
}
