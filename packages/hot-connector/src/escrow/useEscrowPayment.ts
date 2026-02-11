/**
 * useEscrowPayment — orchestrates the Shield escrow checkout flow.
 *
 * Flow: idle → paying (HOT Pay) → escrowed (poll for new escrow) →
 *       confirming → released | refunding → refunded | error
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { getEscrow, getEscrowCount, confirmDelivery, claimTimeoutRefund, openDispute } from './escrowContract';
import { createNearAccount } from '../omni/nearSigner';
import type { Account } from 'near-api-js';
import type { Escrow, EscrowStep, EscrowPaymentOptions, EscrowSession } from './escrowTypes';

const ESCROW_POLL_INTERVAL = 4000;
const SESSION_KEY = 'shield_escrow_session';

function generateSessionId(): string {
  return `se_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function useEscrowPayment(options: EscrowPaymentOptions) {
  const {
    escrowContract,
    sellerAccount,
    hotPayLink,
    buyerNearAccount = '',
    buyerNearKey = '',
    description: defaultDescription = 'Digital goods',
    timeoutMinutes = 1440,
    amount: defaultAmount = '1',
    tokenSymbol = 'USDC',
  } = options;

  const [step, setStep] = useState<EscrowStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('');
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [description, setDescription] = useState(defaultDescription);
  const [amount, setAmount] = useState(defaultAmount);
  const [txHash, setTxHash] = useState<string | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const buyerAccountRef = useRef<Account | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Restore session on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (!saved) return;
      const session: EscrowSession = JSON.parse(saved);
      // Valid for 30 minutes
      if (Date.now() - session.timestamp > 30 * 60 * 1000) {
        localStorage.removeItem(SESSION_KEY);
        return;
      }
      if (session.escrowId) {
        // We already found the escrow — load it
        loadEscrow(session.escrowId);
      } else {
        // Still waiting for escrow creation — resume polling
        setStep('paying');
        startEscrowPolling(session.escrowCountBefore);
      }
    } catch {
      // ignore
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleError = useCallback((err: unknown) => {
    const msg = err instanceof Error ? err.message : 'Operation failed';
    console.error('Escrow flow error:', err);
    setError(msg.length > 200 ? msg.slice(0, 200) + '...' : msg);
    setStep('error');
  }, []);

  const getBuyerAccount = useCallback((): Account | null => {
    if (!buyerNearAccount || !buyerNearKey) return null;
    if (buyerAccountRef.current) return buyerAccountRef.current;
    const account = createNearAccount({
      accountId: buyerNearAccount,
      privateKey: buyerNearKey,
    });
    buyerAccountRef.current = account;
    return account;
  }, [buyerNearAccount, buyerNearKey]);

  /** Load a specific escrow by ID and update state */
  const loadEscrow = useCallback(async (escrowId: string) => {
    try {
      const data = await getEscrow(escrowContract, escrowId);
      if (data) {
        setEscrow(data);
        // Map contract status to our step
        if (data.status === 'funded') setStep('escrowed');
        else if (data.status === 'released') setStep('released');
        else if (data.status === 'refunded') setStep('refunded');
        else if (data.status === 'disputed') setStep('disputed');
        else setStep('escrowed');
      }
    } catch (err) {
      handleError(err);
    }
  }, [escrowContract, handleError]);

  /** Poll for new escrow after HOT Pay */
  const startEscrowPolling = useCallback((countBefore: number) => {
    setStatusText('Waiting for payment to arrive in escrow...');

    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const currentCount = await getEscrowCount(escrowContract);
        if (currentCount > countBefore) {
          // New escrow found!
          clearInterval(pollingRef.current!);
          pollingRef.current = null;

          const newId = `escrow_${currentCount - 1}`;
          const data = await getEscrow(escrowContract, newId);

          if (data && data.seller === sellerAccount) {
            setEscrow(data);
            setStep('escrowed');
            setStatusText('Payment escrowed! Waiting for delivery confirmation.');

            // Update session
            const session: EscrowSession = {
              escrowId: newId,
              escrowCountBefore: countBefore,
              timestamp: Date.now(),
            };
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
          }
        }
      } catch {
        // Keep polling on transient errors
      }
    }, ESCROW_POLL_INTERVAL);
  }, [escrowContract, sellerAccount]);

  // ─── Actions ───

  /** Step 1: Open HOT Pay → funds go to escrow contract */
  const startPayment = useCallback(async () => {
    setError(null);
    setStep('paying');
    setStatusText('Opening HOT Pay...');

    try {
      // Get current escrow count to detect new one
      const countBefore = await getEscrowCount(escrowContract);

      // Save session
      const session: EscrowSession = {
        escrowId: null,
        escrowCountBefore: countBefore,
        timestamp: Date.now(),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));

      // Open HOT Pay
      const payUrl = new URL(hotPayLink);
      payUrl.searchParams.set('amount', amount);
      payUrl.searchParams.set('redirect_url', window.location.origin + window.location.pathname);
      window.open(payUrl.toString(), '_blank');

      // Start polling for new escrow
      startEscrowPolling(countBefore);
    } catch (err) {
      handleError(err);
    }
  }, [escrowContract, hotPayLink, amount, startEscrowPolling, handleError]);

  /** Step 2: Buyer confirms delivery → release to seller */
  const confirmDeliveryAction = useCallback(async () => {
    if (!escrow) return;
    const account = getBuyerAccount();
    if (!account) {
      setError('Buyer NEAR key not configured');
      return;
    }

    setStep('confirming');
    setStatusText('Confirming delivery, releasing funds to merchant...');

    try {
      const { hash } = await confirmDelivery(account, escrowContract, escrow.id);
      setTxHash(hash);
      setStep('released');
      setStatusText('Funds released to merchant!');
      localStorage.removeItem(SESSION_KEY);

      // Reload escrow
      await loadEscrow(escrow.id);
    } catch (err) {
      handleError(err);
    }
  }, [escrow, escrowContract, getBuyerAccount, loadEscrow, handleError]);

  /** Claim timeout refund (anyone can call) */
  const claimRefund = useCallback(async () => {
    if (!escrow) return;
    const account = getBuyerAccount();
    if (!account) {
      setError('NEAR key not configured');
      return;
    }

    setStep('refunding');
    setStatusText('Claiming timeout refund...');

    try {
      const { hash } = await claimTimeoutRefund(account, escrowContract, escrow.id);
      setTxHash(hash);
      setStep('refunded');
      setStatusText('Refund sent to buyer!');
      localStorage.removeItem(SESSION_KEY);
      await loadEscrow(escrow.id);
    } catch (err) {
      handleError(err);
    }
  }, [escrow, escrowContract, getBuyerAccount, loadEscrow, handleError]);

  /** Open dispute */
  const disputeAction = useCallback(async (reason: string) => {
    if (!escrow) return;
    const account = getBuyerAccount();
    if (!account) {
      setError('Buyer NEAR key not configured');
      return;
    }

    setStatusText('Opening dispute...');

    try {
      const { hash } = await openDispute(account, escrowContract, escrow.id, reason);
      setTxHash(hash);
      setStep('disputed');
      setStatusText('Dispute opened. Admin will review.');
      await loadEscrow(escrow.id);
    } catch (err) {
      handleError(err);
    }
  }, [escrow, escrowContract, getBuyerAccount, loadEscrow, handleError]);

  /** Refresh escrow state */
  const refresh = useCallback(async () => {
    if (escrow) {
      await loadEscrow(escrow.id);
    }
  }, [escrow, loadEscrow]);

  /** Reset to start */
  const reset = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setStep('idle');
    setError(null);
    setEscrow(null);
    setStatusText('');
    setTxHash(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  return {
    // State
    step,
    error,
    statusText,
    escrow,
    description,
    setDescription,
    amount,
    setAmount,
    txHash,
    tokenSymbol,

    // Computed
    isTimedOut: escrow ? BigInt(escrow.timeout_at) <= BigInt(Date.now()) * 1_000_000n : false,
    timeoutAt: escrow ? new Date(Number(BigInt(escrow.timeout_at) / 1_000_000n)) : null,

    // Actions
    startPayment,
    confirmDelivery: confirmDeliveryAction,
    claimRefund,
    openDispute: disputeAction,
    refresh,
    reset,
  };
}
