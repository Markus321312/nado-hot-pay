import React from 'react';
import { useHotWallet } from './useHotWallet';

export interface HotPayButtonProps {
  /** Called when connected and button clicked */
  onConnected?: (address: string) => void;
  /** Custom label (default: "Pay with HOT" / "Connect with HOT") */
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

const defaultStyles: Record<string, React.CSSProperties> = {
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #ff8c00, #ff6b00)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    transition: 'opacity 0.2s',
  },
  disabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  icon: {
    width: '18px',
    height: '18px',
  },
};

function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" style={defaultStyles.icon}>
      <path
        d="M12 2C12 2 6 8 6 14a6 6 0 0 0 12 0c0-6-6-12-6-12zm0 18a4 4 0 0 1-4-4c0-2.5 2-6 4-8.5 2 2.5 4 6 4 8.5a4 4 0 0 1-4 4z"
        fill="currentColor"
      />
    </svg>
  );
}

export function HotPayButton({ onConnected, label, className, style }: HotPayButtonProps) {
  const { isHotConnected, evmAddress, connectHot, isAutoConnecting, environment } = useHotWallet();

  const isLoading = isAutoConnecting;

  const handleClick = () => {
    if (isHotConnected && evmAddress) {
      onConnected?.(evmAddress);
    } else {
      connectHot();
    }
  };

  const buttonLabel = isLoading
    ? 'Connecting...'
    : isHotConnected
      ? (label ?? 'Pay with HOT')
      : environment?.isTelegram
        ? 'Connect HOT Wallet'
        : 'Connect with HOT';

  return (
    <button
      className={className}
      style={{ ...defaultStyles.button, ...(isLoading ? defaultStyles.disabled : {}), ...style }}
      onClick={handleClick}
      disabled={isLoading}
    >
      <FlameIcon />
      {buttonLabel}
    </button>
  );
}
