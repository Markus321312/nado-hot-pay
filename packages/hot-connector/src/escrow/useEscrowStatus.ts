/**
 * useEscrowStatus — polls a single escrow and computes timeout info.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { getEscrow } from './escrowContract';
import type { Escrow } from './escrowTypes';

const POLL_INTERVAL = 5000;

export interface UseEscrowStatusOptions {
  escrowContract: string;
  escrowId: string | null;
  /** Auto-poll interval in ms (0 = no polling) */
  pollInterval?: number;
}

export function useEscrowStatus(options: UseEscrowStatusOptions) {
  const { escrowContract, escrowId, pollInterval = POLL_INTERVAL } = options;

  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchEscrow = useCallback(async () => {
    if (!escrowId) return;
    setLoading(true);
    try {
      const data = await getEscrow(escrowContract, escrowId);
      setEscrow(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch escrow');
    } finally {
      setLoading(false);
    }
  }, [escrowContract, escrowId]);

  // Initial fetch + polling
  useEffect(() => {
    if (!escrowId) return;

    fetchEscrow();

    if (pollInterval > 0) {
      pollingRef.current = setInterval(fetchEscrow, pollInterval);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [escrowId, pollInterval, fetchEscrow]);

  // Stop polling once escrow is in terminal state
  useEffect(() => {
    if (escrow && ['released', 'refunded', 'confirmed'].includes(escrow.status)) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
  }, [escrow?.status]);

  // Compute timeout info
  const now = Date.now();
  const timeoutAtMs = escrow ? Number(BigInt(escrow.timeout_at) / 1_000_000n) : 0;
  const isTimedOut = escrow ? now >= timeoutAtMs : false;
  const timeRemainingMs = escrow ? Math.max(0, timeoutAtMs - now) : 0;

  const formatTimeRemaining = (): string => {
    if (!escrow) return '';
    if (isTimedOut) return 'Timed out';
    const mins = Math.floor(timeRemainingMs / 60_000);
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;
    if (hours > 0) return `${hours}h ${remainMins}m`;
    return `${mins}m`;
  };

  return {
    escrow,
    loading,
    error,
    isTimedOut,
    timeRemainingMs,
    timeRemainingFormatted: formatTimeRemaining(),
    refresh: fetchEscrow,
  };
}
