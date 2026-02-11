import { createConnector } from 'wagmi';
import { HOT } from '@hot-wallet/sdk';
import type { HotConnectorOptions } from './types';

/**
 * wagmi v2 connector for HOT Wallet.
 *
 * - Inside HOT Wallet (Telegram iframe): auto-connects via injected provider
 * - Outside: opens HOT Widget/Telegram link for signing
 * - Delegates non-signing RPC calls to configured rpcUrl
 * - Announced via EIP-6963 by @hot-wallet/sdk for AppKit auto-discovery
 */
export function hotWalletConnector(options: HotConnectorOptions = {}) {
  const {
    rpcUrl = 'https://rpc-gel-sepolia.inkonchain.com',
    autoConnect = true,
    chainId: defaultChainId = 763373,
  } = options;

  let hotProvider: any = null;

  const getProvider = async () => {
    if (hotProvider) return hotProvider;
    const mod = await import('@hot-wallet/sdk/adapter/evm');
    hotProvider = mod.hotProvider;
    return hotProvider;
  };

  return createConnector<any>((config) => ({
    id: 'hot-wallet',
    name: 'HOT Wallet',
    type: 'hot-wallet',

    async setup() {
      // Register RPC fallback for non-signing methods (eth_call, eth_getBalance, etc.)
      HOT.setupEthProvider(async (data: any, chain: number) => {
        const url = chain === 763373
          ? rpcUrl
          : `https://eth.llamarpc.com`;

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), ...data }),
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error.message);
        return json.result;
      });
    },

    async connect({ chainId } = {}) {
      const provider = await getProvider();
      const targetChain = chainId ?? defaultChainId;

      // Set chain before requesting accounts
      provider.chainId = targetChain;

      const accounts = await provider.request({
        method: 'eth_requestAccounts',
        params: [],
      });

      return {
        accounts: accounts as readonly `0x${string}`[],
        chainId: targetChain,
      } as any;
    },

    async disconnect() {
      const provider = await getProvider();
      await provider.request({
        method: 'wallet_revokePermissions',
        params: [],
      });
    },

    async getAccounts() {
      const provider = await getProvider();
      const accounts = await provider.request({
        method: 'eth_accounts',
        params: [],
      });
      return (accounts || []) as `0x${string}`[];
    },

    async getChainId() {
      const provider = await getProvider();
      const hex = await provider.request({
        method: 'eth_chainId',
        params: [],
      });
      return parseInt(hex as string, 16);
    },

    async getProvider() {
      return getProvider();
    },

    async isAuthorized() {
      if (!autoConnect) return false;

      // Inside HOT: check if connection state has EVM address
      if (HOT.isInjected) {
        try {
          const state = await Promise.race([
            HOT.connection,
            new Promise<null>((r) => setTimeout(() => r(null), 2000)),
          ]);
          return state?.evm?.address != null;
        } catch {
          return false;
        }
      }

      // Outside: check localStorage for previous connection
      return localStorage.getItem('hot-wallet-evm-account') != null;
    },

    async switchChain({ chainId }) {
      const provider = await getProvider();
      provider.chainId = chainId;

      const chain = config.chains.find((c) => c.id === chainId);
      config.emitter.emit('change', { chainId });
      return chain ?? config.chains[0];
    },

    onAccountsChanged(accounts: string[]) {
      if (accounts.length === 0) {
        config.emitter.emit('disconnect');
      } else {
        config.emitter.emit('change', {
          accounts: accounts as `0x${string}`[],
        });
      }
    },

    onChainChanged(chainId: string) {
      config.emitter.emit('change', {
        chainId: parseInt(chainId, 16),
      });
    },

    onDisconnect() {
      config.emitter.emit('disconnect');
    },
  }));
}
