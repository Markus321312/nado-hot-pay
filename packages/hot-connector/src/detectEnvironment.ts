import { HOT } from '@hot-wallet/sdk';
import type { HotEnvironment } from './types';

/** Synchronous quick check for Telegram and HOT extension */
export function detectHotSync(): Pick<HotEnvironment, 'isTelegram' | 'hasHotExtension'> {
  if (typeof window === 'undefined') {
    return { isTelegram: false, hasHotExtension: false };
  }

  return {
    isTelegram: !!(window as any).Telegram?.WebApp,
    hasHotExtension: !!window.hotExtension,
  };
}

/** Full async detection — waits for HOT SDK initialization */
export async function detectHotEnvironment(): Promise<HotEnvironment> {
  const sync = detectHotSync();

  try {
    const state = await Promise.race([
      HOT.connection,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
    ]);

    return {
      isInsideHot: state != null || HOT.isInjected,
      isTelegram: sync.isTelegram,
      hasHotExtension: sync.hasHotExtension,
      connectionState: state ? 'connected' : 'disconnected',
    };
  } catch {
    return {
      isInsideHot: HOT.isInjected,
      isTelegram: sync.isTelegram,
      hasHotExtension: sync.hasHotExtension,
      connectionState: 'disconnected',
    };
  }
}

/** Check if running inside HOT Wallet (synchronous, fast) */
export function isInsideHotWallet(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return HOT.isInjected || !!window.hotExtension?.autoRun;
  } catch {
    return false;
  }
}
