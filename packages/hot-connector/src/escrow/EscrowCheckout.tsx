/**
 * EscrowCheckout — Hero widget for the Shield escrow buyer checkout flow.
 * Pay with HOT Pay → Funds held in escrow → Confirm or Dispute → Released/Refunded.
 */
import React, { useState } from 'react';
import { useEscrowPayment } from './useEscrowPayment';
import { EscrowTimeline } from './EscrowTimeline';
import type { EscrowPaymentOptions } from './escrowTypes';

export interface EscrowCheckoutProps {
  options: EscrowPaymentOptions;
  onSuccess?: (escrowId: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

const s: Record<string, React.CSSProperties> = {
  container: {
    background: 'linear-gradient(135deg, #1c1c1e 0%, #0e1a2c 100%)',
    border: '1px solid rgba(0, 122, 255, 0.3)',
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
  shieldBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    background: 'rgba(0, 122, 255, 0.15)',
    border: '1px solid rgba(0, 122, 255, 0.3)',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#007aff',
    marginLeft: '8px',
  },
  featureRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#8e8e93',
    padding: '4px 0',
  },
  featureValue: {
    color: '#007aff',
    fontWeight: 600,
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
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '12px',
    background: '#2c2c2e',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    resize: 'vertical' as const,
    minHeight: '60px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
  amountLabel: { fontSize: '13px', color: '#8e8e93' },
  amountValue: { fontSize: '18px', fontWeight: 700, color: '#007aff' },
  payBtn: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #007aff, #0055cc)',
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
  confirmBtn: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #30d158, #28a745)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  dangerBtn: {
    width: '100%',
    padding: '12px',
    background: 'rgba(255, 69, 58, 0.15)',
    color: '#ff453a',
    border: '1px solid rgba(255, 69, 58, 0.3)',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px',
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
    background: 'rgba(0, 122, 255, 0.06)',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#007aff',
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
  escrowInfo: {
    padding: '12px',
    background: 'rgba(0, 122, 255, 0.06)',
    border: '1px solid rgba(0, 122, 255, 0.15)',
    borderRadius: '8px',
    marginBottom: '12px',
  },
  escrowRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    padding: '3px 0',
  },
  escrowKey: { color: '#8e8e93' },
  escrowVal: { color: '#fff', fontFamily: 'monospace', fontSize: '11px' },
  timeoutBar: {
    padding: '8px 12px',
    background: 'rgba(255, 204, 0, 0.1)',
    border: '1px solid rgba(255, 204, 0, 0.2)',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#ffcc00',
    textAlign: 'center' as const,
    marginBottom: '12px',
  },
  note: {
    fontSize: '11px',
    color: '#666',
    textAlign: 'center' as const,
    marginTop: '8px',
  },
};

export function EscrowCheckout({
  options,
  onSuccess,
  className,
  style,
}: EscrowCheckoutProps) {
  const flow = useEscrowPayment(options);
  const {
    step, error, statusText, escrow,
    description, setDescription,
    amount, setAmount, tokenSymbol,
    isTimedOut, timeoutAt,
    startPayment, confirmDelivery, claimRefund, openDispute,
    reset,
  } = flow;

  const [disputeReason, setDisputeReason] = useState('');
  const [showDispute, setShowDispute] = useState(false);

  return (
    <div className={className} style={{ ...s.container, ...style }}>
      {/* Header */}
      <div style={s.title}>
        HOT Pay Shield
        <span style={s.shieldBadge}>Escrow Protected</span>
      </div>
      <div style={s.subtitle}>
        Buyer protection powered by NEAR smart contracts
      </div>

      {/* Feature summary */}
      <div style={{ padding: '0 0 12px 0' }}>
        <div style={s.featureRow}>
          <span>Protection</span>
          <span style={s.featureValue}>Trustless NEAR Escrow</span>
        </div>
        <div style={s.featureRow}>
          <span>Payment</span>
          <span style={s.featureValue}>Any token via HOT Pay</span>
        </div>
        <div style={s.featureRow}>
          <span>Auto-refund</span>
          <span style={s.featureValue}>{options.timeoutMinutes || 1440} min timeout</span>
        </div>
        <div style={s.featureRow}>
          <span>Dispute</span>
          <span style={s.featureValue}>Admin resolution</span>
        </div>
      </div>

      {/* Input phase */}
      {step === 'idle' && (
        <>
          <div style={s.inputGroup}>
            <label style={s.label}>What are you buying?</label>
            <input
              type="text"
              style={s.input}
              placeholder="e.g. Premium Widget"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={s.amountRow}>
            <span style={s.amountLabel}>Amount</span>
            <span style={s.amountValue}>{amount} {tokenSymbol}</span>
          </div>

          <button
            style={s.payBtn}
            onClick={startPayment}
          >
            Pay {amount} {tokenSymbol} with Shield
          </button>
        </>
      )}

      {/* Paying — HOT Pay open */}
      {step === 'paying' && (
        <>
          <EscrowTimeline currentStep={step} />
          <div style={s.statusBar}>
            {statusText || 'HOT Pay opened. Complete payment there.'}
          </div>
          <button style={s.secondaryBtn} onClick={reset}>
            Cancel
          </button>
        </>
      )}

      {/* Escrowed — funds locked, waiting for buyer action */}
      {step === 'escrowed' && escrow && (
        <>
          <EscrowTimeline currentStep={step} />

          <div style={s.escrowInfo}>
            <div style={s.escrowRow}>
              <span style={s.escrowKey}>Escrow ID</span>
              <span style={s.escrowVal}>{escrow.id}</span>
            </div>
            <div style={s.escrowRow}>
              <span style={s.escrowKey}>Amount</span>
              <span style={s.escrowVal}>{(Number(escrow.amount) / 1e6).toFixed(2)} USDC</span>
            </div>
            <div style={s.escrowRow}>
              <span style={s.escrowKey}>Seller</span>
              <span style={s.escrowVal}>{escrow.seller}</span>
            </div>
            <div style={s.escrowRow}>
              <span style={s.escrowKey}>Description</span>
              <span style={s.escrowVal}>{escrow.description}</span>
            </div>
          </div>

          {/* Timeout warning */}
          {timeoutAt && (
            <div style={s.timeoutBar}>
              {isTimedOut
                ? 'Timeout reached — you can claim a refund'
                : `Auto-refund available: ${timeoutAt.toLocaleString()}`
              }
            </div>
          )}

          <div style={s.statusBar}>
            Funds are safely held in escrow. Confirm when you receive your goods.
          </div>

          <button style={s.confirmBtn} onClick={confirmDelivery}>
            Confirm Delivery — Release Funds
          </button>

          {isTimedOut && (
            <button style={s.dangerBtn} onClick={claimRefund}>
              Claim Timeout Refund
            </button>
          )}

          {/* Dispute section */}
          {!showDispute ? (
            <button
              style={s.secondaryBtn}
              onClick={() => setShowDispute(true)}
            >
              Open Dispute
            </button>
          ) : (
            <div style={{ marginTop: '8px' }}>
              <textarea
                style={s.textarea}
                placeholder="Describe the issue..."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
              />
              <button
                style={{ ...s.dangerBtn, marginTop: '4px' }}
                onClick={() => {
                  if (disputeReason.trim()) {
                    openDispute(disputeReason.trim());
                    setShowDispute(false);
                  }
                }}
                disabled={!disputeReason.trim()}
              >
                Submit Dispute
              </button>
              <button
                style={s.secondaryBtn}
                onClick={() => setShowDispute(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </>
      )}

      {/* Confirming / releasing */}
      {step === 'confirming' && (
        <>
          <EscrowTimeline currentStep={step} />
          <div style={s.statusBar}>{statusText || 'Releasing funds...'}</div>
        </>
      )}

      {/* Released */}
      {step === 'released' && (
        <>
          <EscrowTimeline currentStep={step} />
          <div style={s.successBar}>
            <div style={s.successTitle}>Payment Complete!</div>
            <div style={s.successSubtext}>
              Funds released to merchant. Transaction confirmed on NEAR.
            </div>
          </div>
          <button style={s.secondaryBtn} onClick={reset}>
            New Payment
          </button>
        </>
      )}

      {/* Refunding / refunded */}
      {(step === 'refunding' || step === 'refunded') && (
        <>
          <EscrowTimeline currentStep={step} />
          {step === 'refunding' ? (
            <div style={s.statusBar}>{statusText || 'Processing refund...'}</div>
          ) : (
            <div style={s.successBar}>
              <div style={s.successTitle}>Refund Complete!</div>
              <div style={s.successSubtext}>Funds returned to buyer.</div>
            </div>
          )}
          {step === 'refunded' && (
            <button style={s.secondaryBtn} onClick={reset}>
              New Payment
            </button>
          )}
        </>
      )}

      {/* Disputed */}
      {step === 'disputed' && escrow && (
        <>
          <EscrowTimeline currentStep={step} />
          <div style={s.timeoutBar}>
            Dispute opened. Reason: {escrow.dispute_reason || 'N/A'}
          </div>
          <div style={s.statusBar}>
            Waiting for admin to resolve this dispute.
          </div>
          <button style={s.secondaryBtn} onClick={() => flow.refresh()}>
            Refresh Status
          </button>
        </>
      )}

      {/* Error */}
      {step === 'error' && (
        <>
          <div style={s.errorBar}>{error ?? 'An error occurred'}</div>
          <button style={s.secondaryBtn} onClick={reset}>
            Try Again
          </button>
        </>
      )}

      <div style={s.note}>
        Powered by HOT Pay + NEAR Smart Contract Escrow
      </div>
    </div>
  );
}
