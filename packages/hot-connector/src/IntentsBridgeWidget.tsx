import React, { useEffect } from 'react';
import { useIntentsBridge } from './useIntentsBridge';
import type { UseIntentsBridgeOptions } from './useIntentsBridge';

export interface IntentsBridgeWidgetProps {
  /** Bridge configuration */
  options?: UseIntentsBridgeOptions;
  /** Called when bridge succeeds */
  onSuccess?: (amountOut: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

const s: Record<string, React.CSSProperties> = {
  container: {
    background: '#1c1c1e',
    borderRadius: '12px',
    padding: '20px',
    maxWidth: '440px',
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
    background: 'rgba(88, 166, 255, 0.15)',
    color: '#58a6ff',
    borderRadius: '4px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#8e8e93',
    marginBottom: '6px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  chainRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '6px',
    marginBottom: '14px',
  },
  chainChip: {
    padding: '6px 12px',
    background: '#2c2c2e',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '8px',
    color: '#8e8e93',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  chainChipActive: {
    padding: '6px 12px',
    background: 'rgba(255, 140, 0, 0.1)',
    border: '1px solid rgba(255, 140, 0, 0.4)',
    borderRadius: '8px',
    color: '#ff8c00',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  tokenRow: {
    display: 'flex',
    gap: '6px',
    marginBottom: '14px',
  },
  tokenChip: {
    padding: '6px 14px',
    background: '#2c2c2e',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '8px',
    color: '#8e8e93',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  tokenChipActive: {
    padding: '6px 14px',
    background: 'rgba(255, 140, 0, 0.1)',
    border: '1px solid rgba(255, 140, 0, 0.4)',
    borderRadius: '8px',
    color: '#ff8c00',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  inputWrap: {
    position: 'relative' as const,
    marginBottom: '14px',
  },
  input: {
    width: '100%',
    padding: '12px 80px 12px 12px',
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
  arrow: {
    textAlign: 'center' as const,
    padding: '6px 0',
    fontSize: '18px',
    color: '#ff8c00',
  },
  destRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    background: '#2c2c2e',
    borderRadius: '8px',
    marginBottom: '14px',
    fontSize: '13px',
  },
  quoteCard: {
    background: '#2c2c2e',
    borderRadius: '10px',
    padding: '12px',
    marginBottom: '14px',
  },
  quoteRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#8e8e93',
    marginBottom: '6px',
  },
  quoteValue: {
    color: '#fff',
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
  },
  bridgeBtn: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #58a6ff, #388bfd)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  bridgeBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  status: {
    textAlign: 'center' as const,
    padding: '24px 0',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid rgba(88,166,255,0.2)',
    borderTopColor: '#58a6ff',
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
  testnetNote: {
    fontSize: '11px',
    color: '#ff8c00',
    textAlign: 'center' as const,
    padding: '8px',
    background: 'rgba(255, 140, 0, 0.06)',
    borderRadius: '8px',
    marginBottom: '12px',
  },
};

function formatAmount(raw: string, decimals: number): string {
  if (!raw || raw === '0') return '0';
  const num = Number(raw) / 10 ** decimals;
  if (num < 0.01) return '<0.01';
  return num.toFixed(2);
}

function formatTime(ms?: number): string {
  if (!ms) return '~1-5 min';
  const sec = Math.ceil(ms / 1000);
  if (sec < 60) return `~${sec}s`;
  return `~${Math.ceil(sec / 60)} min`;
}

export function IntentsBridgeWidget({
  options,
  onSuccess,
  className,
  style,
}: IntentsBridgeWidgetProps) {
  const bridge = useIntentsBridge(options);

  const {
    step, sourceChain, sourceToken, destChain, destToken, amount,
    quote, error,
    supportedChains, availableSourceTokens, availableDestTokens,
    setSourceChain, setSourceToken, setDestChain, setDestToken, setAmount,
    fetchQuote, reset,
  } = bridge;

  // Auto-fetch quote when amount changes (debounced)
  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0) return;
    const timer = setTimeout(() => fetchQuote(true), 600);
    return () => clearTimeout(timer);
  }, [amount, sourceChain, sourceToken, destChain, destToken]);

  // Processing states
  if (step === 'quoting') {
    return (
      <div className={className} style={{ ...s.container, ...style }}>
        <div style={s.status}>
          <div style={s.spinner} />
          <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Getting bridge quote...</div>
          <div style={{ color: '#8e8e93', fontSize: '12px', marginTop: '4px' }}>
            Querying NEAR Intents solvers
          </div>
        </div>
      </div>
    );
  }

  if (step === 'depositing' || step === 'polling') {
    const label = step === 'depositing' ? 'Sending to bridge...' : 'Bridge in progress...';
    return (
      <div className={className} style={{ ...s.container, ...style }}>
        <div style={s.status}>
          <div style={s.spinner} />
          <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>{label}</div>
          <div style={{ color: '#8e8e93', fontSize: '12px', marginTop: '4px' }}>
            NEAR Intents market makers are filling your order
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className={className} style={{ ...s.container, ...style }}>
        <div style={s.status}>
          <div style={s.successText}>Bridge successful!</div>
          <div style={{ color: '#8e8e93', fontSize: '12px', marginTop: '4px' }}>
            Tokens bridged via NEAR Intents
          </div>
          <button style={s.retryBtn} onClick={() => { reset(); onSuccess?.(quote?.amountOut ?? '0'); }}>
            Continue to Deposit
          </button>
        </div>
      </div>
    );
  }

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

  // Default: idle or quoted
  const destChainInfo = supportedChains.find((c) => c.chainId === destChain);
  const hasQuote = step === 'quoted' && quote;
  const sourceDecimals = availableSourceTokens.find((t) => t.symbol === sourceToken)?.decimals ?? 6;
  const destDecimals = availableDestTokens.find((t) => t.symbol === destToken)?.decimals ?? 6;

  return (
    <div className={className} style={{ ...s.container, ...style }}>
      <div style={s.title}>
        Cross-Chain Bridge
        <span style={s.badge}>NEAR Intents</span>
      </div>

      <div style={s.testnetNote}>
        Quotes are live from NEAR Intents. Bridge execution available on mainnet.
      </div>

      {/* Source chain */}
      <div style={s.label}>From Chain</div>
      <div style={s.chainRow}>
        {supportedChains.map((chain) => (
          <button
            key={chain.chainId}
            style={chain.chainId === sourceChain ? s.chainChipActive : s.chainChip}
            onClick={() => {
              setSourceChain(chain.chainId);
              const tokens = availableSourceTokens;
              if (tokens.length > 0 && !tokens.find((t) => t.symbol === sourceToken)) {
                setSourceToken(tokens[0].symbol);
              }
            }}
          >
            {chain.icon} {chain.chainName}
          </button>
        ))}
      </div>

      {/* Source token */}
      <div style={s.label}>Token</div>
      <div style={s.tokenRow}>
        {availableSourceTokens.map((token) => (
          <button
            key={token.symbol}
            style={token.symbol === sourceToken ? s.tokenChipActive : s.tokenChip}
            onClick={() => setSourceToken(token.symbol)}
          >
            {token.symbol}
          </button>
        ))}
        {availableSourceTokens.length === 0 && (
          <span style={{ color: '#8e8e93', fontSize: '12px' }}>No supported tokens for this chain</span>
        )}
      </div>

      {/* Amount */}
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
        <span style={s.suffix}>{sourceToken}</span>
      </div>

      {/* Arrow */}
      <div style={s.arrow}>↓</div>

      {/* Destination */}
      <div style={s.label}>To</div>
      <div style={s.destRow}>
        <span>{destChainInfo?.icon} {destChainInfo?.chainName ?? destChain}</span>
        <span style={{ fontWeight: 600 }}>{destToken}</span>
      </div>

      {/* Quote card */}
      {hasQuote && (
        <div style={s.quoteCard}>
          <div style={s.quoteRow}>
            <span>You send</span>
            <span style={s.quoteValue}>{formatAmount(quote.amountIn, sourceDecimals)} {sourceToken}</span>
          </div>
          <div style={s.quoteRow}>
            <span>You receive</span>
            <span style={s.quoteValue}>{formatAmount(quote.amountOut, destDecimals)} {destToken}</span>
          </div>
          {quote.amountOutUsd && (
            <div style={s.quoteRow}>
              <span>Value</span>
              <span style={s.quoteValue}>${parseFloat(quote.amountOutUsd).toFixed(2)}</span>
            </div>
          )}
          <div style={s.quoteRow}>
            <span>Min received</span>
            <span style={s.quoteValue}>{formatAmount(quote.minAmountOut, destDecimals)} {destToken}</span>
          </div>
          <div style={s.quoteRow}>
            <span>Estimated time</span>
            <span style={s.quoteValue}>{formatTime(quote.timeEstimateMs)}</span>
          </div>
          <div style={{ ...s.quoteRow, marginBottom: 0 }}>
            <span>Route</span>
            <span style={{ ...s.quoteValue, color: '#58a6ff' }}>NEAR Intents</span>
          </div>
        </div>
      )}

      {/* Bridge button */}
      <button
        style={{
          ...s.bridgeBtn,
          ...(!hasQuote ? s.bridgeBtnDisabled : {}),
        }}
        disabled={!hasQuote}
        onClick={() => fetchQuote(true)}
      >
        {hasQuote ? `Bridge ${amount} ${sourceToken}` : 'Enter amount to get quote'}
      </button>

      <div style={s.info}>
        Powered by NEAR Intents — decentralized cross-chain settlement
      </div>
    </div>
  );
}
