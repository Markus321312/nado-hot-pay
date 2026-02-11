/**
 * EscrowTimeline — 4-step visual timeline for Shield escrow flow.
 * Steps: Pay → Escrowed → Confirm/Dispute → Released/Refunded
 */
import React from 'react';
import type { EscrowStep } from './escrowTypes';

interface TimelineStep {
  label: string;
  number: number;
}

const STEPS: TimelineStep[] = [
  { label: 'Pay via HOT Pay', number: 1 },
  { label: 'Funds in Escrow', number: 2 },
  { label: 'Confirm Delivery', number: 3 },
  { label: 'Funds Released', number: 4 },
];

function getStepIndex(step: EscrowStep): number {
  switch (step) {
    case 'idle': return -1;
    case 'paying': return 0;
    case 'escrowed': return 1;
    case 'confirming': return 2;
    case 'released': return 3;
    case 'refunding': return 2;
    case 'refunded': return 3;
    case 'disputed': return 2;
    case 'error': return -1;
    default: return -1;
  }
}

function getStatus(
  stepIdx: number,
  currentIdx: number,
  escrowStep: EscrowStep,
): 'done' | 'active' | 'pending' {
  if (escrowStep === 'released' || escrowStep === 'refunded') return 'done';
  if (stepIdx < currentIdx) return 'done';
  if (stepIdx === currentIdx) return 'active';
  return 'pending';
}

// Adjust labels for refund/dispute paths
function getLabel(step: TimelineStep, escrowStep: EscrowStep): string {
  if (step.number === 3 && escrowStep === 'disputed') return 'Dispute Opened';
  if (step.number === 3 && escrowStep === 'refunding') return 'Claiming Refund';
  if (step.number === 4 && escrowStep === 'refunded') return 'Funds Refunded';
  return step.label;
}

const css: Record<string, React.CSSProperties> = {
  container: { marginBottom: '16px' },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  circle: {
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
  done: { background: '#30d158', color: '#fff' },
  active: { background: '#ff8c00', color: '#fff' },
  pending: {
    background: '#2c2c2e',
    color: '#8e8e93',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  label: { fontSize: '14px', fontWeight: 600, flex: 1, color: '#fff' },
  statusText: { fontSize: '12px', fontWeight: 600 },
  statusDone: { color: '#30d158' },
  statusActive: { color: '#ff8c00' },
  statusPending: { color: '#8e8e93' },
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

export interface EscrowTimelineProps {
  currentStep: EscrowStep;
}

export function EscrowTimeline({ currentStep }: EscrowTimelineProps) {
  const currentIdx = getStepIndex(currentStep);

  return (
    <div style={css.container}>
      {STEPS.map((stepDef) => {
        const status = getStatus(stepDef.number - 1, currentIdx, currentStep);
        const circleStyle =
          status === 'done'
            ? { ...css.circle, ...css.done }
            : status === 'active'
              ? { ...css.circle, ...css.active }
              : { ...css.circle, ...css.pending };
        const statusStyle =
          status === 'done'
            ? css.statusDone
            : status === 'active'
              ? css.statusActive
              : css.statusPending;

        return (
          <div key={stepDef.number} style={css.row}>
            <div style={circleStyle}>
              {status === 'done' ? '\u2713' : stepDef.number}
            </div>
            <span style={css.label}>{getLabel(stepDef, currentStep)}</span>
            <span style={{ ...css.statusText, ...statusStyle }}>
              {status === 'done' && 'Done'}
              {status === 'active' && <span style={css.spinner} />}
              {status === 'pending' && 'Pending'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
