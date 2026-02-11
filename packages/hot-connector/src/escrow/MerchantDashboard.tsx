/**
 * MerchantDashboard — Merchant view of Shield escrows.
 * Lists all escrows for a given seller, shows status, amounts, timeouts.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { getEscrowsBySeller, getEscrowCount } from './escrowContract';
import type { Escrow, EscrowStatus } from './escrowTypes';

export interface MerchantDashboardProps {
  escrowContract: string;
  sellerAccount: string;
  className?: string;
  style?: React.CSSProperties;
}

const STATUS_COLORS: Record<EscrowStatus, string> = {
  funded: '#007aff',
  confirmed: '#30d158',
  disputed: '#ff9500',
  refunded: '#ff453a',
  released: '#30d158',
};

const STATUS_LABELS: Record<EscrowStatus, string> = {
  funded: 'In Escrow',
  confirmed: 'Confirmed',
  disputed: 'Disputed',
  refunded: 'Refunded',
  released: 'Released',
};

const s: Record<string, React.CSSProperties> = {
  container: {
    background: 'linear-gradient(135deg, #1c1c1e 0%, #1a0e2c 100%)',
    border: '1px solid rgba(175, 82, 222, 0.3)',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '440px',
    width: '100%',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#fff',
  },
  title: { fontSize: '18px', fontWeight: 700, marginBottom: '4px' },
  subtitle: { fontSize: '12px', color: '#8e8e93', marginBottom: '16px' },
  statsRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
  },
  statCard: {
    flex: 1,
    padding: '12px',
    background: '#2c2c2e',
    borderRadius: '8px',
    textAlign: 'center' as const,
  },
  statValue: { fontSize: '20px', fontWeight: 700, color: '#af52de' },
  statLabel: { fontSize: '11px', color: '#8e8e93', marginTop: '2px' },
  escrowCard: {
    padding: '12px',
    background: '#2c2c2e',
    borderRadius: '10px',
    marginBottom: '8px',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  escrowHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  escrowId: { fontSize: '13px', fontWeight: 700, color: '#fff' },
  statusBadge: {
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 600,
  },
  escrowRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    padding: '2px 0',
  },
  escrowKey: { color: '#8e8e93' },
  escrowVal: { color: '#fff', fontFamily: 'monospace', fontSize: '11px' },
  emptyState: {
    padding: '32px',
    textAlign: 'center' as const,
    color: '#8e8e93',
    fontSize: '14px',
  },
  refreshBtn: {
    width: '100%',
    padding: '10px',
    background: '#2c2c2e',
    color: '#af52de',
    border: '1px solid rgba(175, 82, 222, 0.3)',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px',
  },
  loading: {
    textAlign: 'center' as const,
    padding: '20px',
    color: '#8e8e93',
    fontSize: '13px',
  },
};

export function MerchantDashboard({
  escrowContract,
  sellerAccount,
  className,
  style,
}: MerchantDashboardProps) {
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [list, count] = await Promise.all([
        getEscrowsBySeller(escrowContract, sellerAccount, 0, 50),
        getEscrowCount(escrowContract),
      ]);
      setEscrows(list);
      setTotalCount(count);
    } catch (err) {
      console.error('Failed to fetch escrows:', err);
    } finally {
      setLoading(false);
    }
  }, [escrowContract, sellerAccount]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Stats
  const funded = escrows.filter(e => e.status === 'funded');
  const released = escrows.filter(e => e.status === 'released');
  const totalReleased = released.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className={className} style={{ ...s.container, ...style }}>
      <div style={s.title}>Merchant Dashboard</div>
      <div style={s.subtitle}>{sellerAccount}</div>

      {/* Stats */}
      <div style={s.statsRow}>
        <div style={s.statCard}>
          <div style={s.statValue}>{funded.length}</div>
          <div style={s.statLabel}>Active</div>
        </div>
        <div style={s.statCard}>
          <div style={{ ...s.statValue, color: '#30d158' }}>
            {(totalReleased / 1e6).toFixed(2)}
          </div>
          <div style={s.statLabel}>USDC Released</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statValue}>{totalCount}</div>
          <div style={s.statLabel}>Total Escrows</div>
        </div>
      </div>

      {/* Escrow list */}
      {loading && escrows.length === 0 ? (
        <div style={s.loading}>Loading escrows...</div>
      ) : escrows.length === 0 ? (
        <div style={s.emptyState}>
          No escrows yet. Payments with Shield will appear here.
        </div>
      ) : (
        escrows.map((escrow) => {
          const color = STATUS_COLORS[escrow.status] || '#8e8e93';
          const timeoutMs = Number(BigInt(escrow.timeout_at) / 1_000_000n);
          const isTimedOut = Date.now() >= timeoutMs;

          return (
            <div key={escrow.id} style={s.escrowCard}>
              <div style={s.escrowHeader}>
                <span style={s.escrowId}>{escrow.id}</span>
                <span
                  style={{
                    ...s.statusBadge,
                    background: `${color}22`,
                    color,
                    border: `1px solid ${color}44`,
                  }}
                >
                  {STATUS_LABELS[escrow.status] || escrow.status}
                </span>
              </div>
              <div style={s.escrowRow}>
                <span style={s.escrowKey}>Amount</span>
                <span style={s.escrowVal}>
                  {(Number(escrow.amount) / 1e6).toFixed(2)} USDC
                </span>
              </div>
              <div style={s.escrowRow}>
                <span style={s.escrowKey}>Buyer</span>
                <span style={s.escrowVal}>
                  {escrow.buyer.length > 24
                    ? escrow.buyer.slice(0, 12) + '...' + escrow.buyer.slice(-8)
                    : escrow.buyer}
                </span>
              </div>
              <div style={s.escrowRow}>
                <span style={s.escrowKey}>Description</span>
                <span style={s.escrowVal}>{escrow.description}</span>
              </div>
              {escrow.status === 'funded' && (
                <div style={s.escrowRow}>
                  <span style={s.escrowKey}>Timeout</span>
                  <span style={{ ...s.escrowVal, color: isTimedOut ? '#ff453a' : '#ffcc00' }}>
                    {isTimedOut
                      ? 'Expired'
                      : new Date(timeoutMs).toLocaleString()}
                  </span>
                </div>
              )}
              {escrow.dispute_reason && (
                <div style={s.escrowRow}>
                  <span style={s.escrowKey}>Dispute</span>
                  <span style={{ ...s.escrowVal, color: '#ff9500' }}>
                    {escrow.dispute_reason}
                  </span>
                </div>
              )}
            </div>
          );
        })
      )}

      <button style={s.refreshBtn} onClick={fetchData}>
        Refresh
      </button>
    </div>
  );
}
