import React from 'react';
import { createRoot } from 'react-dom/client';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { defineChain } from 'viem';
import { hotWalletConnector } from '@nado-hot-bridge/connector';
import { App } from './App';

const inkSepolia = defineChain({
  id: 763373,
  name: 'Ink Sepolia',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc-gel-sepolia.inkonchain.com'] },
  },
  testnet: true,
});

const config = createConfig({
  chains: [inkSepolia],
  connectors: [
    hotWalletConnector({
      rpcUrl: 'https://rpc-gel-sepolia.inkonchain.com',
      chainId: 763373,
    }),
  ],
  transports: {
    [inkSepolia.id]: http(),
  },
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 10_000, retry: 2 } },
});

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <App />
      </WagmiProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
