# HOT Wallet Integration Guide

> Based on [HOT Wallet SDK](https://github.com/hot-dao/hot-sdk-js) (`@hot-wallet/sdk`) and [HOT Protocol docs](https://docs.hotdao.ai/).

Add HOT Wallet support to any wagmi-based dApp in 3 steps.

## Step 1: Install

```bash
npm install @nado-hot-bridge/connector @hot-wallet/sdk
```

## Step 2: Configure wagmi

```typescript
import { createConfig, http } from 'wagmi';
import { hotWalletConnector } from '@nado-hot-bridge/connector';

const config = createConfig({
  chains: [yourChain],
  connectors: [
    hotWalletConnector({
      rpcUrl: 'https://your-rpc-endpoint.com',
      autoConnect: true, // auto-connect inside HOT Wallet
    }),
  ],
  transports: { [yourChain.id]: http() },
});
```

## Step 3: Use in React

### Basic Connection

```tsx
import { useHotWallet } from '@nado-hot-bridge/connector';

function WalletStatus() {
  const { isHotConnected, evmAddress, nearAddress, connectHot } = useHotWallet();

  if (isHotConnected) {
    return <div>Connected via HOT: {evmAddress}</div>;
  }

  return <button onClick={connectHot}>Connect HOT Wallet</button>;
}
```

### Pay Button

```tsx
import { HotPayButton } from '@nado-hot-bridge/connector';

function PaySection() {
  return (
    <HotPayButton
      label="Deposit with HOT"
      onConnected={(address) => {
        console.log('Connected:', address);
      }}
    />
  );
}
```

### Deposit Widget

```tsx
import { HotDepositWidget } from '@nado-hot-bridge/connector';

function DepositPage() {
  return (
    <HotDepositWidget
      config={{
        tokenAddress: '0x...', // Your ERC20 token
        endpointAddress: '0x...', // Your deposit contract
        tokenDecimals: 6,
      }}
      onSuccess={() => console.log('Deposited!')}
    />
  );
}
```

## How It Works

1. **Detection**: `@hot-wallet/sdk` detects if running inside HOT Wallet (Telegram iframe or browser extension)
2. **EIP-6963**: HOT provider announces itself (rdns: `org.hot-labs`), auto-discovered by Reown AppKit
3. **RPC Fallback**: `setupEthProvider()` handles read-only calls (eth_call, eth_getBalance) -- [HOT SDK docs](https://github.com/hot-dao/hot-sdk-js): "hotProvider implements methods that require a private key signature. All other methods must be implemented using your own RPC."
4. **MPC Signing**: Transaction signing goes through HOT's decentralized MPC signer using ECDSA/EdDSA -- [details](https://docs.hotdao.ai/mpc-wallet/signature-generation-via-mpc)
5. **Cross-Chain**: HOT Protocol on NEAR enables access from 100+ chains via [Chain Abstraction](https://docs.near.org/chain-abstraction/intents/overview)

## Testing

Open the HOT Wallet test browser:
```
https://t.me/herewalletbot/app?startapp=browser
```

Enter your dApp URL and verify:
- Auto-connection works
- Transactions can be signed
- Balance reads correctly

## Existing Wallet Compatibility

The HOT connector coexists with other wallets. When not in HOT environment:
- MetaMask, WalletConnect, etc. work normally
- HOT appears as an option in the wallet selector
- No conflicts with existing EIP-6963 providers

## Alternative: HOT Kit

For new projects without an existing wallet stack, consider [HOT Kit](https://github.com/hot-dao/hot-connector) (`@hot-labs/kit`) -- a higher-level SDK with built-in UI, multi-chain connectors, portfolio view, and token exchange. See [HOT Kit docs](https://docs.hotdao.ai/hot-kit).

```bash
yarn add @hot-labs/kit react react-dom
```

HOT Kit replaces wagmi/Reown entirely with its own connector system. Use `@hot-wallet/sdk` (this guide) when integrating into existing wagmi-based dApps.

## Resources

- [HOT Protocol Docs](https://docs.hotdao.ai/)
- [HOT Wallet SDK](https://github.com/hot-dao/hot-sdk-js) -- `@hot-wallet/sdk`
- [HOT Kit](https://github.com/hot-dao/hot-connector) -- `@hot-labs/kit`
- [HOT Pay API Keys](https://pay.hot-labs.org/admin/api-keys)
- [MPC Signing Flow](https://docs.hotdao.ai/mpc-wallet/signature-generation-via-mpc)
- [HOT Whitepaper](https://arxiv.org/abs/2512.02287)
- [NEAR Chain Abstraction](https://docs.near.org/chain-abstraction/intents/overview)
