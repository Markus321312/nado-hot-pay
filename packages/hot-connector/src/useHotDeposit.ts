import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useReadContract, usePublicClient } from 'wagmi';
import { parseAbi, type Address } from 'viem';
import type { HotPayConfig } from './types';

// NADO contract addresses (Ink Sepolia testnet)
const DEFAULT_USDT0 = '0x60f50f902b2e91aef7d6c700eb22599e297fa86f' as Address;
const DEFAULT_ENDPOINT = '0x698d87105274292b5673367dec81874ce3633ac2' as Address;
const DEFAULT_SUBACCOUNT = '0x64656661756c740000000000' as `0x${string}`;
const DEFAULT_DECIMALS = 6;
const USDT0_PRODUCT_ID = 0;

const erc20Abi = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function mint(address to, uint256 amount)',
]);

const endpointAbi = parseAbi([
  'function depositCollateral(bytes12 subaccountName, uint32 productId, uint128 amount)',
]);

export type HotDepositStep =
  | 'idle'
  | 'minting'
  | 'approving'
  | 'depositing'
  | 'success'
  | 'error';

export function useHotDeposit(config: HotPayConfig = {}) {
  const {
    tokenAddress = DEFAULT_USDT0,
    endpointAddress = DEFAULT_ENDPOINT,
    subaccountName = DEFAULT_SUBACCOUNT,
    tokenDecimals = DEFAULT_DECIMALS,
  } = config;

  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [step, setStep] = useState<HotDepositStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<'mint' | 'deposit' | null>(null);

  const { data: rawBalance, refetch: refetchBalance } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const balance = rawBalance
    ? (Number(rawBalance) / 10 ** tokenDecimals).toFixed(2)
    : '0.00';

  const handleError = (err: unknown) => {
    const message = err instanceof Error ? err.message : 'Transaction failed';
    if (message.includes('User rejected') || message.includes('user rejected')) {
      setError('Transaction rejected');
    } else {
      setError(message.length > 100 ? message.slice(0, 100) + '...' : message);
    }
    setStep('error');
  };

  /** Mint test tokens (testnet only) */
  const mint = useCallback(async (amount = 100_000_000n) => {
    if (!address || !publicClient) return;
    setError(null);
    setLastAction('mint');
    setStep('minting');

    try {
      const hash = await writeContractAsync({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'mint',
        args: [address, amount],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      await refetchBalance();
      setStep('success');
    } catch (err) {
      handleError(err);
    }
  }, [address, publicClient, writeContractAsync, tokenAddress, refetchBalance]);

  /** Deposit: approve + depositCollateral */
  const deposit = useCallback(async (amountStr: string) => {
    if (!address || !publicClient) return;

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      setError('Enter a valid amount');
      setStep('error');
      return;
    }

    const amountRaw = BigInt(Math.floor(amount * 10 ** tokenDecimals));
    setError(null);
    setLastAction('deposit');

    try {
      // Step 1: Approve
      setStep('approving');
      const approveHash = await writeContractAsync({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [endpointAddress, amountRaw],
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      // Step 2: Deposit collateral
      setStep('depositing');
      const depositHash = await writeContractAsync({
        address: endpointAddress,
        abi: endpointAbi,
        functionName: 'depositCollateral',
        args: [subaccountName, USDT0_PRODUCT_ID, amountRaw],
      });
      await publicClient.waitForTransactionReceipt({ hash: depositHash });
      await refetchBalance();
      setStep('success');
    } catch (err) {
      handleError(err);
    }
  }, [address, publicClient, writeContractAsync, tokenAddress, endpointAddress, subaccountName, tokenDecimals, refetchBalance]);

  const reset = useCallback(() => {
    setStep('idle');
    setError(null);
    setLastAction(null);
  }, []);

  return { step, error, lastAction, balance, deposit, mint, reset, refetchBalance };
}
