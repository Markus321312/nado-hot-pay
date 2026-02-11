import React, { useState } from 'react';
import {
  HotPayFlowWidget,
  EscrowCheckout,
  MerchantDashboard,
} from '@nado-hot-bridge/connector';

const HOT_PAY_ITEM_ID = 'b1a7dd70c7d49c9c212cfee656301f9de167ba40e032e1f079c8fd564bc17594';
const HOT_PAY_LINK = `https://pay.hot-labs.org/payment?item_id=${HOT_PAY_ITEM_ID}`;

// Shield Escrow contract — update after deployment
const ESCROW_CONTRACT = import.meta.env.VITE_ESCROW_CONTRACT || 'shield-escrow.near';
const SELLER_ACCOUNT = import.meta.env.VITE_MERCHANT_NEAR_ACCOUNT || 'something_special777.tg';

// HOT Pay link for escrow — receiver = escrow contract
// Update item_id after creating a new HOT Pay item with receiver = ESCROW_CONTRACT
const ESCROW_HOT_PAY_ITEM_ID = import.meta.env.VITE_ESCROW_HOT_PAY_ITEM_ID || HOT_PAY_ITEM_ID;
const ESCROW_HOT_PAY_LINK = `https://pay.hot-labs.org/payment?item_id=${ESCROW_HOT_PAY_ITEM_ID}`;

type Tab = 'shield-buyer' | 'shield-merchant' | 'direct-pay';

const styles: Record<string, React.CSSProperties> = {
  app: {
    maxWidth: '500px',
    margin: '0 auto',
    padding: '20px',
    minHeight: '100vh',
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
    paddingTop: '20px',
  },
  logo: {
    fontSize: '28px',
    fontWeight: 800,
    background: 'linear-gradient(135deg, #007aff, #5856d6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '13px',
    color: '#8e8e93',
    marginBottom: '8px',
  },
  hackBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    background: 'rgba(0, 122, 255, 0.1)',
    border: '1px solid rgba(0, 122, 255, 0.2)',
    borderRadius: '20px',
    fontSize: '11px',
    color: '#007aff',
    fontWeight: 600,
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    marginBottom: '20px',
    background: '#1c1c1e',
    borderRadius: '10px',
    padding: '3px',
  },
  tab: {
    flex: 1,
    padding: '10px 8px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    background: 'transparent',
    color: '#8e8e93',
    transition: 'all 0.2s',
  },
  tabActive: {
    background: '#2c2c2e',
    color: '#fff',
  },
  section: {
    marginBottom: '20px',
  },
  footer: {
    textAlign: 'center',
    padding: '20px 0',
    fontSize: '11px',
    color: '#555',
  },
  link: {
    color: '#007aff',
    textDecoration: 'none',
  },
  infoBox: {
    padding: '12px',
    background: 'rgba(0, 122, 255, 0.06)',
    border: '1px solid rgba(0, 122, 255, 0.15)',
    borderRadius: '10px',
    fontSize: '12px',
    color: '#8e8e93',
    marginBottom: '16px',
    lineHeight: 1.5,
  },
  infoTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#007aff',
    marginBottom: '4px',
  },
};

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('shield-buyer');

  return (
    <div style={styles.app}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>HOT Pay Shield</div>
        <div style={styles.subtitle}>Trustless Escrow for HOT Pay Payments</div>
        <span style={styles.hackBadge}>NEARCON 2026 Innovation Sandbox</span>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'shield-buyer' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('shield-buyer')}
        >
          Buy with Shield
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'shield-merchant' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('shield-merchant')}
        >
          Merchant
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'direct-pay' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('direct-pay')}
        >
          Direct Pay
        </button>
      </div>

      {/* Shield Buyer Tab */}
      {activeTab === 'shield-buyer' && (
        <div style={styles.section}>
          <div style={styles.infoBox}>
            <div style={styles.infoTitle}>How Shield Works</div>
            1. Pay with any token via HOT Pay — funds go to escrow contract<br />
            2. Merchant delivers goods/services<br />
            3. Confirm delivery to release funds, or claim auto-refund after timeout
          </div>

          <EscrowCheckout
            options={{
              escrowContract: ESCROW_CONTRACT,
              sellerAccount: SELLER_ACCOUNT,
              hotPayLink: ESCROW_HOT_PAY_LINK,
              buyerNearAccount: import.meta.env.VITE_BUYER_NEAR_ACCOUNT || '',
              buyerNearKey: import.meta.env.VITE_BUYER_NEAR_KEY || '',
              description: 'Digital goods',
              timeoutMinutes: 60,
              amount: '1',
              tokenSymbol: 'USDC',
            }}
            onSuccess={(id) => console.log('Escrow confirmed:', id)}
          />
        </div>
      )}

      {/* Merchant Tab */}
      {activeTab === 'shield-merchant' && (
        <div style={styles.section}>
          <div style={styles.infoBox}>
            <div style={styles.infoTitle}>Merchant View</div>
            See all incoming Shield escrows. Funds are released when the buyer
            confirms delivery. Disputes are resolved by the contract admin.
          </div>

          <MerchantDashboard
            escrowContract={ESCROW_CONTRACT}
            sellerAccount={SELLER_ACCOUNT}
          />
        </div>
      )}

      {/* Direct Pay Tab (original flow) */}
      {activeTab === 'direct-pay' && (
        <div style={styles.section}>
          <div style={styles.infoBox}>
            <div style={styles.infoTitle}>Direct HOT Pay</div>
            Pay and bridge directly — no escrow protection. Funds go straight to
            the merchant and are bridged to your destination chain.
          </div>

          <HotPayFlowWidget
            options={{
              hotPayItemId: HOT_PAY_ITEM_ID,
              hotPayLink: HOT_PAY_LINK,
              merchantNearAccount: import.meta.env.VITE_MERCHANT_NEAR_ACCOUNT || '',
              merchantNearKey: import.meta.env.VITE_MERCHANT_NEAR_KEY || '',
              amount: '1',
              paymentTokenSymbol: 'USDC',
            }}
            onSuccess={(tx) => console.log('HOT Pay flow complete:', tx)}
          />
        </div>
      )}

      {/* Footer */}
      <div style={styles.footer}>
        Built for NEARCON 2026 Innovation Sandbox<br />
        Powered by{' '}
        <a href="https://hot-labs.org/pay/" target="_blank" rel="noopener" style={styles.link}>
          HOT Pay
        </a>
        {' '}+{' '}
        <a href="https://near.org" target="_blank" rel="noopener" style={styles.link}>
          NEAR Smart Contracts
        </a>
      </div>
    </div>
  );
}
