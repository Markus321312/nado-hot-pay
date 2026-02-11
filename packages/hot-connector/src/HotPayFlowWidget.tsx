import React, { useEffect } from 'react';
import { useHotPayFlow } from './useHotPayFlow';
import type { HotPayFlowOptions, FlowStep } from './useHotPayFlow';

export interface HotPayFlowWidgetProps {
  options: HotPayFlowOptions;
  onSuccess?: (txHash: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

// --- Step definitions (3 steps) ---

interface StepDef {
  key: FlowStep;
  label: string;
  number: number;
}

const STEPS: StepDef[] = [
  { key: 'paying', label: 'Pay via HOT Pay', number: 1 },
  { key: 'waiting', label: 'Claim + Bridge (NEAR)', number: 2 },
  { key: 'polling', label: 'USDT0 delivered on Ink', number: 3 },
];

function getStepIndex(step: FlowStep): number {
  if (step === 'input') return -1;
  if (step === 'paying') return 0;
  if (step === 'waiting' || step === 'bridging') return 1;
  if (step === 'polling') return 2;
  if (step === 'success') return 3; // all done
  return -1;
}

function getStepStatus(
  stepIndex: number,
  currentIndex: number,
  currentStep: FlowStep,
): 'done' | 'active' | 'pending' {
  if (currentStep === 'success') return 'done';
  if (stepIndex < currentIndex) return 'done';
  if (stepIndex === currentIndex) return 'active';
  return 'pending';
}

// --- Styles ---

const s: Record<string, React.CSSProperties> = {
  container: {
    background: 'linear-gradient(135deg, #1c1c1e 0%, #2c1a0e 100%)',
    border: '1px solid rgba(255, 140, 0, 0.3)',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '440px',
    width: '100%',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#fff',
  },
  title: {
    fontSize: '18px',
    fontWeight: 700,
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '12px',
    color: '#8e8e93',
    marginBottom: '20px',
  },
  inputGroup: {
    marginBottom: '16px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#8e8e93',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '6px',
    display: 'block',
  },
  input: {
    width: '100%',
    padding: '12px',
    background: '#2c2c2e',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontFamily: 'monospace',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  inputError: {
    borderColor: '#ff453a',
  },
  amountRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    background: '#2c2c2e',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  amountLabel: {
    fontSize: '13px',
    color: '#8e8e93',
  },
  amountValue: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#ff8c00',
  },
  stepsContainer: {
    marginBottom: '16px',
  },
  stepRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  stepCircle: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 700,
    flexShrink: 0,
  },
  stepDone: {
    background: '#30d158',
    color: '#fff',
  },
  stepActive: {
    background: '#ff8c00',
    color: '#fff',
  },
  stepPending: {
    background: '#2c2c2e',
    color: '#8e8e93',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  stepLabel: {
    fontSize: '14px',
    fontWeight: 600,
    flex: 1,
  },
  stepStatus: {
    fontSize: '12px',
    fontWeight: 600,
  },
  statusDone: { color: '#30d158' },
  statusActive: { color: '#ff8c00' },
  statusPending: { color: '#8e8e93' },
  payBtn: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #ff8c00, #ff6b00)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  payBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  secondaryBtn: {
    width: '100%',
    padding: '12px',
    background: '#2c2c2e',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px',
  },
  statusBar: {
    padding: '10px 12px',
    background: 'rgba(255, 140, 0, 0.06)',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#ff8c00',
    textAlign: 'center' as const,
    marginBottom: '12px',
  },
  errorBar: {
    padding: '10px 12px',
    background: 'rgba(255, 69, 58, 0.1)',
    border: '1px solid rgba(255, 69, 58, 0.3)',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#ff453a',
    textAlign: 'center' as const,
    marginBottom: '12px',
  },
  successBar: {
    padding: '16px',
    background: 'rgba(48, 209, 88, 0.1)',
    border: '1px solid rgba(48, 209, 88, 0.3)',
    borderRadius: '10px',
    textAlign: 'center' as const,
    marginBottom: '12px',
  },
  successTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#30d158',
    marginBottom: '4px',
  },
  successSubtext: {
    fontSize: '12px',
    color: '#8e8e93',
  },
  txLink: {
    fontSize: '11px',
    color: '#58a6ff',
    fontFamily: 'monospace',
    wordBreak: 'break-all' as const,
    marginTop: '8px',
    display: 'block',
  },
  featureRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#8e8e93',
    padding: '4px 0',
  },
  featureValue: {
    color: '#ff8c00',
    fontWeight: 600,
  },
  note: {
    fontSize: '11px',
    color: '#666',
    textAlign: 'center' as const,
    marginTop: '8px',
  },
  spinner: {
    display: 'inline-block',
    width: '14px',
    height: '14px',
    border: '2px solid rgba(255,140,0,0.2)',
    borderTopColor: '#ff8c00',
    borderRadius: '50%',
    animation: 'hot-spin 0.8s linear infinite',
  },
};

// --- Component ---

export function HotPayFlowWidget({
  options,
  onSuccess,
  className,
  style,
}: HotPayFlowWidgetProps) {
  const flow = useHotPayFlow(options);
  const {
    recipientAddress, setRecipientAddress,
    currentStep, error, txHashes, statusText,
    isValidAddress, amount, paymentTokenSymbol,
    startPayment, confirmPayment, reset,
  } = flow;

  const currentIndex = getStepIndex(currentStep);

  // Notify parent on success
  useEffect(() => {
    if (currentStep === 'success' && txHashes.nearTxHash) {
      onSuccess?.(txHashes.nearTxHash);
    }
  }, [currentStep, txHashes.nearTxHash, onSuccess]);

  return (
    <div className={className} style={{ ...s.container, ...style }}>
      <div style={s.title}>NADO x HOT Pay Checkout</div>
      <div style={s.subtitle}>Pay with any token, any chain → receive USDT0 on Ink</div>

      {/* Feature summary */}
      <div style={{ padding: '0 0 12px 0' }}>
        <div style={s.featureRow}>
          <span>Accept</span>
          <span style={s.featureValue}>50+ tokens via HOT Pay</span>
        </div>
        <div style={s.featureRow}>
          <span>Bridge</span>
          <span style={s.featureValue}>NEAR Intents (Omni)</span>
        </div>
        <div style={s.featureRow}>
          <span>Destination</span>
          <span style={s.featureValue}>Ink Sepolia</span>
        </div>
        <div style={s.featureRow}>
          <span>You receive</span>
          <span style={s.featureValue}>USDT0</span>
        </div>
      </div>

      {/* Wallet input */}
      <div style={s.inputGroup}>
        <label style={s.label}>Your Ink Wallet Address</label>
        <input
          type="text"
          style={{
            ...s.input,
            ...(recipientAddress && !isValidAddress ? s.inputError : {}),
          }}
          placeholder="0x..."
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          disabled={currentStep !== 'input'}
        />
      </div>

      {/* Amount display */}
      <div style={s.amountRow}>
        <span style={s.amountLabel}>Amount</span>
        <span style={s.amountValue}>{amount} {paymentTokenSymbol}</span>
      </div>

      {/* Steps indicator (3 steps) */}
      {currentStep !== 'input' && (
        <div style={s.stepsContainer}>
          {STEPS.map((stepDef) => {
            const status = getStepStatus(stepDef.number - 1, currentIndex, currentStep);
            const circleStyle = status === 'done'
              ? { ...s.stepCircle, ...s.stepDone }
              : status === 'active'
                ? { ...s.stepCircle, ...s.stepActive }
                : { ...s.stepCircle, ...s.stepPending };
            const statusStyle = status === 'done'
              ? s.statusDone
              : status === 'active'
                ? s.statusActive
                : s.statusPending;

            return (
              <div key={stepDef.key} style={s.stepRow}>
                <div style={circleStyle}>
                  {status === 'done' ? '\u2713' : stepDef.number}
                </div>
                <span style={s.stepLabel}>{stepDef.label}</span>
                <span style={{ ...s.stepStatus, ...statusStyle }}>
                  {status === 'done' && 'Done'}
                  {status === 'active' && <span style={s.spinner} />}
                  {status === 'pending' && 'Pending'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Status bar */}
      {statusText && currentStep !== 'success' && currentStep !== 'error' && (
        <div style={s.statusBar}>{statusText}</div>
      )}

      {/* Error */}
      {(error || currentStep === 'error') && (
        <div style={s.errorBar}>
          {error ?? 'An error occurred'}
        </div>
      )}

      {/* Success */}
      {currentStep === 'success' && (
        <div style={s.successBar}>
          <div style={s.successTitle}>Payment Complete!</div>
          <div style={s.successSubtext}>
            USDT0 delivered to your Ink wallet via NEAR Intents
          </div>
          {txHashes.nearTxHash && (
            <span style={s.txLink}>
              NEAR tx: {txHashes.nearTxHash}
            </span>
          )}
          {txHashes.amountOut && (
            <span style={{ ...s.txLink, color: '#30d158' }}>
              Received: {(Number(txHashes.amountOut) / 1e6).toFixed(2)} USDT0
            </span>
          )}
        </div>
      )}

      {/* Action buttons */}
      {currentStep === 'input' && (
        <button
          style={{
            ...s.payBtn,
            ...(!isValidAddress ? s.payBtnDisabled : {}),
          }}
          disabled={!isValidAddress}
          onClick={startPayment}
        >
          Pay {amount} {paymentTokenSymbol} with HOT Pay
        </button>
      )}

      {currentStep === 'paying' && (
        <>
          <div style={s.statusBar}>
            HOT Pay opened in new tab. Complete your payment there.
          </div>
          <button style={s.payBtn} onClick={confirmPayment}>
            I've Completed Payment
          </button>
          <button style={s.secondaryBtn} onClick={reset}>
            Cancel
          </button>
        </>
      )}

      {currentStep === 'error' && (
        <button style={s.secondaryBtn} onClick={reset}>
          Try Again
        </button>
      )}

      {currentStep === 'success' && (
        <button style={s.secondaryBtn} onClick={reset}>
          New Payment
        </button>
      )}

      <div style={s.note}>
        Powered by HOT Pay + NEAR Intents
      </div>
    </div>
  );
}
