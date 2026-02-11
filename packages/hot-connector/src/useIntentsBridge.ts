import { useState, useCallback, useRef, useEffect } from 'react';
import { getQuote, getSwapStatus, submitDepositTx } from './intents/oneClickApi';
import { getAssetId, getTokensForChain, SUPPORTED_CHAINS } from './intents/tokens';
import type { QuoteResponse, SwapStatus } from './intents/oneClickApi';
import type { ChainInfo, TokenInfo } from './intents/tokens';

export type BridgeStep =
  | 'idle'
  | 'quoting'
  | 'quoted'
  | 'depositing'
  | 'polling'
  | 'success'
  | 'error';

export interface BridgeQuote {
  depositAddress: string;
  amountIn: string;
  amountOut: string;
  amountOutUsd?: string;
  minAmountOut: string;
  timeEstimateMs?: number;
}

export interface UseIntentsBridgeOptions {
  /** Default source chain (default: 'eth') */
  defaultSourceChain?: string;
  /** Default source token (default: 'USDT') */
  defaultSourceToken?: string;
  /** Default destination chain (default: 'near') */
  defaultDestChain?: string;
  /** Default destination token (default: 'USDT') */
  defaultDestToken?: string;
  /** Slippage tolerance in basis points (default: 100 = 1%) */
  slippageTolerance?: number;
  /** Refund address for failed swaps */
  refundAddress?: string;
  /** Recipient address on destination chain */
  recipientAddress?: string;
}

export function useIntentsBridge(options: UseIntentsBridgeOptions = {}) {
  const {
    defaultSourceChain = 'eth',
    defaultSourceToken = 'USDT',
    defaultDestChain = 'near',
    defaultDestToken = 'USDT',
    slippageTolerance = 100,
    refundAddress = '',
    recipientAddress = '',
  } = options;

  const [step, setStep] = useState<BridgeStep>('idle');
  const [sourceChain, setSourceChain] = useState(defaultSourceChain);
  const [sourceToken, setSourceToken] = useState(defaultSourceToken);
  const [destChain, setDestChain] = useState(defaultDestChain);
  const [destToken, setDestToken] = useState(defaultDestToken);
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<BridgeQuote | null>(null);
  const [swapStatus, setSwapStatus] = useState<SwapStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stop polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const availableSourceTokens = getTokensForChain(sourceChain);
  const availableDestTokens = getTokensForChain(destChain);

  const handleError = useCallback((err: unknown) => {
    const msg = err instanceof Error ? err.message : 'Bridge operation failed';
    setError(msg.length > 150 ? msg.slice(0, 150) + '...' : msg);
    setStep('error');
  }, []);

  /** Get a bridge quote (dry=true for preview without reserving) */
  const fetchQuote = useCallback(async (dry = true) => {
    const originAsset = getAssetId(sourceChain, sourceToken);
    const destAsset = getAssetId(destChain, destToken);
    if (!originAsset || !destAsset) {
      setError(`Unsupported pair: ${sourceChain}:${sourceToken} → ${destChain}:${destToken}`);
      setStep('error');
      return null;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Enter a valid amount');
      setStep('error');
      return null;
    }

    // Find decimals for source token
    const tokenInfo = availableSourceTokens.find((t) => t.symbol === sourceToken);
    const decimals = tokenInfo?.decimals ?? 6;
    const amountRaw = BigInt(Math.floor(parseFloat(amount) * 10 ** decimals)).toString();

    setError(null);
    setStep('quoting');

    try {
      const result = await getQuote({
        dry,
        swapType: 'EXACT_INPUT',
        slippageTolerance,
        originAsset,
        destinationAsset: destAsset,
        amount: amountRaw,
        depositType: 'ORIGIN_CHAIN',
        refundTo: refundAddress || '0x0000000000000000000000000000000000000000',
        refundType: 'ORIGIN_CHAIN',
        recipient: recipientAddress || '0x0000000000000000000000000000000000000000',
        recipientType: 'DESTINATION_CHAIN',
      });

      const bridgeQuote: BridgeQuote = {
        depositAddress: result.depositAddress,
        amountIn: result.amountIn,
        amountOut: result.amountOut,
        amountOutUsd: result.amountOutUsd,
        minAmountOut: result.minAmountOut,
        timeEstimateMs: result.timeEstimateMs,
      };

      setQuote(bridgeQuote);
      setStep('quoted');
      return bridgeQuote;
    } catch (err) {
      handleError(err);
      return null;
    }
  }, [sourceChain, sourceToken, destChain, destToken, amount, slippageTolerance, refundAddress, recipientAddress, availableSourceTokens, handleError]);

  /** Start polling swap status after user deposits to the deposit address */
  const startPolling = useCallback((depositAddress: string) => {
    setStep('polling');

    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const status = await getSwapStatus(depositAddress);
        setSwapStatus(status.status);

        if (status.status === 'SUCCESS') {
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          setStep('success');
        } else if (status.status === 'FAILED' || status.status === 'REFUNDED') {
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          setError(`Bridge ${status.status.toLowerCase()}`);
          setStep('error');
        }
      } catch {
        // Don't fail on polling errors — keep retrying
      }
    }, 5000);
  }, []);

  /** Notify 1Click about a deposit transaction */
  const notifyDeposit = useCallback(async (txHash: string, depositAddress: string) => {
    setStep('depositing');
    try {
      await submitDepositTx(txHash, depositAddress);
      startPolling(depositAddress);
    } catch (err) {
      handleError(err);
    }
  }, [startPolling, handleError]);

  const reset = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setStep('idle');
    setQuote(null);
    setSwapStatus(null);
    setError(null);
    setAmount('');
  }, []);

  return {
    // State
    step,
    sourceChain,
    sourceToken,
    destChain,
    destToken,
    amount,
    quote,
    swapStatus,
    error,

    // Chain/token metadata
    supportedChains: SUPPORTED_CHAINS,
    availableSourceTokens,
    availableDestTokens,

    // Setters
    setSourceChain,
    setSourceToken,
    setDestChain,
    setDestToken,
    setAmount,

    // Actions
    fetchQuote,
    notifyDeposit,
    startPolling,
    reset,
  };
}
