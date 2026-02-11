import { useState, useCallback, useRef, useEffect } from 'react';
import { getQuote, getSwapStatus } from './intents/oneClickApi';
import type { QuoteResponse, SwapStatus } from './intents/oneClickApi';
import {
  createNearAccount,
  ftTransferCall,
  ftBalance,
  NEAR_USDC_CONTRACT,
} from './omni/nearSigner';
import { DEFUSE_ASSETS } from './omni/omniTokens';
import type { Account } from 'near-api-js';

// --- Supported destination chains ---

export interface DestinationChain {
  id: string;
  name: string;
  defuseAsset: string;
  tokenSymbol: string;
  explorerTx?: string;
}

export const DESTINATION_CHAINS: DestinationChain[] = [
  {
    id: 'base',
    name: 'Base',
    defuseAsset: DEFUSE_ASSETS.BASE_USDC,
    tokenSymbol: 'USDC',
    explorerTx: 'https://basescan.org/tx/',
  },
  {
    id: 'arb',
    name: 'Arbitrum',
    defuseAsset: DEFUSE_ASSETS.ARB_USDC,
    tokenSymbol: 'USDC',
    explorerTx: 'https://arbiscan.io/tx/',
  },
  {
    id: 'arb-usdt',
    name: 'Arbitrum (USDT)',
    defuseAsset: DEFUSE_ASSETS.ARB_USDT,
    tokenSymbol: 'USDT',
    explorerTx: 'https://arbiscan.io/tx/',
  },
];

// --- Types ---

export type FlowStep =
  | 'input'
  | 'paying'
  | 'waiting'
  | 'bridging'
  | 'polling'
  | 'success'
  | 'error';

export interface HotPayFlowOptions {
  hotPayItemId: string;
  hotPayLink: string;
  merchantNearAccount: string;
  merchantNearKey: string;
  /** Default amount (user can change) */
  amount?: string;
  paymentTokenSymbol?: string;
}

export interface FlowTxHashes {
  paymentId?: string;
  depositAddress?: string;
  nearTxHash?: string;
  swapStatus?: SwapStatus;
  amountOut?: string;
  destinationTxHashes?: string[];
}

const USDC_DECIMALS = 6;
const BALANCE_POLL_INTERVAL = 4000;
const BRIDGE_POLL_INTERVAL = 5000;
const SESSION_KEY = 'hotpay_session';

interface PaymentSession {
  paymentId: string;
  recipientAddress: string;
  amount: string;
  chainId: string;
  balanceBefore: string;
  timestamp: number;
}

function generatePaymentId(): string {
  return `hp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function useHotPayFlow(options: HotPayFlowOptions) {
  const {
    hotPayLink,
    merchantNearAccount,
    merchantNearKey,
    amount: defaultAmount = '1',
    paymentTokenSymbol = 'USDC',
  } = options;

  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState(defaultAmount);
  const [selectedChain, setSelectedChain] = useState<DestinationChain>(DESTINATION_CHAINS[0]);
  const [currentStep, setCurrentStep] = useState<FlowStep>('input');
  const [error, setError] = useState<string | null>(null);
  const [txHashes, setTxHashes] = useState<FlowTxHashes>({});
  const [statusText, setStatusText] = useState('');
  const [merchantBalance, setMerchantBalance] = useState<string | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nearAccountRef = useRef<Account | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Check for saved session on mount (redirect return)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        const session: PaymentSession = JSON.parse(saved);
        // Session valid for 30 minutes
        if (Date.now() - session.timestamp < 30 * 60 * 1000) {
          setRecipientAddress(session.recipientAddress);
          setAmount(session.amount);
          const chain = DESTINATION_CHAINS.find(c => c.id === session.chainId);
          if (chain) setSelectedChain(chain);
          setTxHashes(prev => ({ ...prev, paymentId: session.paymentId }));
          // Auto-resume: go to waiting step
          setCurrentStep('waiting');
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleError = useCallback((err: unknown) => {
    const msg = err instanceof Error ? err.message : 'Operation failed';
    console.error('HOT Pay Flow error:', err);
    setError(msg.length > 200 ? msg.slice(0, 200) + '...' : msg);
    setCurrentStep('error');
  }, []);

  const isValidAddress = useCallback((addr: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  }, []);

  const getNearAccount = useCallback((): Account => {
    if (nearAccountRef.current) return nearAccountRef.current;
    const account = createNearAccount({
      accountId: merchantNearAccount,
      privateKey: merchantNearKey,
    });
    nearAccountRef.current = account;
    return account;
  }, [merchantNearAccount, merchantNearKey]);

  const checkBalance = useCallback(async (): Promise<string | null> => {
    try {
      const account = getNearAccount();
      const balance = await ftBalance(account, NEAR_USDC_CONTRACT);
      setMerchantBalance(balance);
      return balance;
    } catch (err) {
      console.warn('Balance check failed:', err);
      return null;
    }
  }, [getNearAccount]);

  // --- STEP 1: Open HOT Pay ---

  const startPayment = useCallback(async () => {
    if (!isValidAddress(recipientAddress)) {
      setError('Enter a valid EVM wallet address (0x...)');
      return;
    }
    setError(null);

    // Get initial balance
    const balanceBefore = await checkBalance() || '0';

    // Generate unique payment ID
    const paymentId = generatePaymentId();
    setTxHashes(prev => ({ ...prev, paymentId }));

    // Save session for redirect return
    const session: PaymentSession = {
      paymentId,
      recipientAddress,
      amount,
      chainId: selectedChain.id,
      balanceBefore,
      timestamp: Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    setCurrentStep('paying');

    // Build HOT Pay URL with amount hint
    const payUrl = new URL(hotPayLink);
    payUrl.searchParams.set('amount', amount);
    payUrl.searchParams.set('redirect_url', window.location.origin + window.location.pathname);

    window.open(payUrl.toString(), '_blank');
  }, [recipientAddress, amount, selectedChain, hotPayLink, isValidAddress, checkBalance]);

  // --- STEP 2: Wait for payment (auto-poll balance) ---

  const startWaitingForPayment = useCallback(() => {
    setCurrentStep('waiting');
    setStatusText('Waiting for HOT Pay deposit to arrive...');

    if (pollingRef.current) clearInterval(pollingRef.current);

    let savedSession: PaymentSession | null = null;
    try {
      const s = localStorage.getItem(SESSION_KEY);
      if (s) savedSession = JSON.parse(s);
    } catch { /* ignore */ }

    const balanceBefore = savedSession?.balanceBefore || '0';

    pollingRef.current = setInterval(async () => {
      try {
        const currentBalance = await checkBalance();
        if (currentBalance) {
          const before = BigInt(balanceBefore);
          const current = BigInt(currentBalance);
          const diff = current - before;
          if (diff > 0n) {
            clearInterval(pollingRef.current!);
            pollingRef.current = null;
            setStatusText(`Payment received: +${(Number(diff) / 1e6).toFixed(2)} USDC. Starting bridge...`);
            // Auto-start bridge after 1s
            setTimeout(() => {
              startBridge();
            }, 1000);
          } else {
            setStatusText(`Merchant balance: ${(Number(current) / 1e6).toFixed(2)} USDC. Waiting for deposit...`);
          }
        }
      } catch {
        // Keep polling on transient errors
      }
    }, BALANCE_POLL_INTERVAL);
  }, [checkBalance]);

  // Auto-start balance polling when step becomes 'waiting'
  useEffect(() => {
    if (currentStep === 'waiting') {
      startWaitingForPayment();
    }
  }, [currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- STEP 3: Bridge via 1Click (NEAR USDC → destination chain) ---

  const startBridge = useCallback(async () => {
    setCurrentStep('bridging');
    setStatusText('Getting bridge quote from NEAR Intents...');

    try {
      const amountAtomic = BigInt(Math.floor(parseFloat(amount) * 10 ** USDC_DECIMALS)).toString();

      const quote: QuoteResponse = await getQuote({
        dry: false,
        swapType: 'EXACT_INPUT',
        slippageTolerance: 100,
        originAsset: DEFUSE_ASSETS.NEAR_USDC,
        destinationAsset: selectedChain.defuseAsset,
        amount: amountAtomic,
        depositType: 'ORIGIN_CHAIN',
        refundTo: merchantNearAccount,
        refundType: 'ORIGIN_CHAIN',
        recipient: recipientAddress,
        recipientType: 'DESTINATION_CHAIN',
      });

      if (!quote.depositAddress) {
        throw new Error('No deposit address returned from bridge quote');
      }

      setTxHashes(prev => ({ ...prev, depositAddress: quote.depositAddress }));
      const outAmount = (Number(quote.amountOut) / 1e6).toFixed(2);
      setStatusText(`Quote: ${outAmount} ${selectedChain.tokenSymbol} on ${selectedChain.name}. Sending USDC...`);

      // Sign and submit ft_transfer_call
      const account = getNearAccount();
      setStatusText('Signing NEAR transaction...');

      const { hash: txHash } = await ftTransferCall(
        account,
        NEAR_USDC_CONTRACT,
        quote.depositAddress,
        amountAtomic,
        '',
      );

      setTxHashes(prev => ({ ...prev, nearTxHash: txHash }));
      setStatusText('NEAR transaction submitted! Waiting for bridge...');

      // Move to polling step
      setCurrentStep('polling');
      startBridgePolling(quote.depositAddress);

    } catch (err) {
      handleError(err);
    }
  }, [amount, selectedChain, merchantNearAccount, recipientAddress, getNearAccount, handleError]);

  /** Poll 1Click swap status until complete */
  const startBridgePolling = useCallback((depositAddress: string) => {
    setStatusText('Bridge in progress via NEAR Intents...');

    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const status = await getSwapStatus(depositAddress);
        setTxHashes(prev => ({ ...prev, swapStatus: status.status }));

        if (status.status === 'PROCESSING') {
          setStatusText('Intents solvers are filling your order...');
        }

        if (status.status === 'SUCCESS') {
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          setTxHashes(prev => ({
            ...prev,
            amountOut: status.amountOut,
            destinationTxHashes: status.destinationTxHashes,
          }));
          setStatusText(`${selectedChain.tokenSymbol} delivered to your ${selectedChain.name} wallet!`);
          setCurrentStep('success');
          localStorage.removeItem(SESSION_KEY);
        } else if (status.status === 'FAILED' || status.status === 'REFUNDED') {
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          setError(`Bridge ${status.status.toLowerCase()}. Tokens refunded to merchant.`);
          setCurrentStep('error');
          localStorage.removeItem(SESSION_KEY);
        }
      } catch {
        // Keep polling on transient errors
      }
    }, BRIDGE_POLL_INTERVAL);
  }, [selectedChain]);

  /** Manually confirm payment (skip auto-detection) */
  const confirmPayment = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = null;
    startBridge();
  }, [startBridge]);

  /** Reset flow to start */
  const reset = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setCurrentStep('input');
    setError(null);
    setTxHashes({});
    setStatusText('');
    setMerchantBalance(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  return {
    // State
    recipientAddress,
    setRecipientAddress,
    amount,
    setAmount,
    selectedChain,
    setSelectedChain,
    currentStep,
    error,
    txHashes,
    statusText,
    merchantBalance,

    // Derived
    isValidAddress: isValidAddress(recipientAddress),
    paymentTokenSymbol,
    destinationChains: DESTINATION_CHAINS,

    // Actions
    startPayment,
    confirmPayment,
    startBridge,
    checkBalance,
    reset,
  };
}
