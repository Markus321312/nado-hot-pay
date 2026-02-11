# HOT Pay Integration Guide

## What is HOT Pay?

HOT Pay is a non-custodial crypto payment gateway by HOT Labs. It allows any website or Telegram Mini App to accept payments in 50+ tokens across 20+ chains, with automatic conversion and settlement via NEAR OmniBridge and NEAR Intents.

- Admin dashboard: https://pay.hot-labs.org/admin
- Documentation: https://hot-labs.gitbook.io/hot-pay/
- SDK: `@hot-labs/kit`

## NADO as a HOT Pay Merchant

NADO DEX uses HOT Pay to accept deposits from any chain. Instead of requiring users to manually bridge tokens to Ink Sepolia, HOT Pay handles the routing:

```
User (USDT on Ethereum)
     |
     v
HOT Pay routes via NEAR Intents
     |
     v
NADO receives USDT0 on Ink Sepolia
     |
     v
User trades perps
```

## Three Integration Paths

### 1. HOT Pay Embedded Checkout (`@hot-labs/kit`)

Full SDK with multi-chain wallet connection, portfolio, and exchange. Used in our demo app.

```typescript
import { HotKit } from '@hot-labs/kit';
import { defaultConnectors } from '@hot-labs/kit/defaults';

const kit = new HotKit({
  connectors: defaultConnectors,
  apiKey: 'YOUR_API_KEY', // from pay.hot-labs.org/admin/api-keys
});

// Connect user wallet
const wallet = await kit.connect();

// Open bridge UI for cross-chain token exchange
await kit.openBridge();

// Or build custom intents
const intent = kit.intentsBuilder(wallet)
  .give(OmniToken.USDT, 100_000000n)  // 100 USDT (6 decimals)
  .take(OmniToken.USDC, 99_500000n);  // Receive ~99.5 USDC
await intent.execute();
```

**Pros**: Full HOT Pay experience, multi-chain wallet support, built-in exchange UI
**Cons**: Large bundle (~7MB), requires `vite-plugin-node-polyfills`

### 2. Custom Integration (`@hot-wallet/sdk` + 1Click API)

Lightweight approach using the low-level HOT SDK and NEAR Intents API directly. Used in NADO DEX production.

```typescript
import { HOT } from '@hot-wallet/sdk';

// Detect HOT environment and connect
const isHot = HOT.isInjected;
const state = await HOT.connection;

// Get bridge quote from NEAR Intents
const quote = await fetch('https://1click.chaindefuser.com/v0/quote', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dry: true,
    swap_type: 'EXACT_INPUT',
    slippage_tolerance: 100,
    origin_asset: 'nep141:eth-0xdac17f958d2ee523a2206206994597c13d831ec7.omft.near',
    destination_asset: 'nep141:usdt.tether-token.near',
    amount: '100000000', // 100 USDT
    deposit_type: 'ORIGIN_CHAIN',
    refund_to: evmAddress,
    refund_type: 'ORIGIN_CHAIN',
    recipient: nearAddress,
    recipient_type: 'DESTINATION_CHAIN',
    deadline: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  }),
});
```

**Pros**: Zero extra dependencies, full UI control, ~0KB overhead
**Cons**: More code, manual wallet handling

### 3. Pay Links (URL-based)

Generate payment URLs that open HOT Pay checkout. Best for external referrals and invoices.

```
https://pay.hot-labs.org/checkout?merchant=NADO&amount=100&token=USDT
```

## Why DEX as HOT Pay Merchant?

This is a novel use case: instead of HOT Pay being used for e-commerce (buy coffee with crypto), we use it for **DeFi onboarding**. Every DEX, lending protocol, or yield farm could become a HOT Pay merchant to simplify deposits.

Benefits:
- Users pay with **any token on any chain**
- Merchant (DEX) receives **the exact token it needs**
- **Non-custodial** -- funds go directly to smart contracts
- **No KYC** -- just connect wallet and pay
- **Telegram-native** -- 30M+ HOT Wallet users

## Supported Chains

| Chain | Tokens |
|-------|--------|
| Ethereum | USDT, USDC |
| Arbitrum | USDT, USDC |
| Base | USDC |
| Solana | USDC |
| TON | USDT |
| BNB Chain | USDT, USDC |
| NEAR | USDT, USDC |

## API Reference

### 1Click API (NEAR Intents)

Base URL: `https://1click.chaindefuser.com`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v0/tokens` | GET | List all supported tokens |
| `/v0/quote` | POST | Get bridge quote (use `dry: true` for preview) |
| `/v0/status?depositAddress=X` | GET | Check swap execution status |
| `/v0/deposit/submit` | POST | Notify API of deposit transaction |

### HOT SDK

```typescript
import { HOT } from '@hot-wallet/sdk';

HOT.isInjected        // true if inside HOT Wallet
HOT.connection        // Promise<{near, evm, solana, ton, telegramId}>
HOT.setupEthProvider(fn) // Register RPC fallback for read-only calls
```

## Links

- [HOT Pay](https://hot-labs.org/pay/)
- [HOT Pay Admin](https://pay.hot-labs.org/admin/api-keys)
- [HOT Kit](https://github.com/hot-dao/kit)
- [HOT SDK](https://github.com/hot-dao/hot-sdk-js)
- [1Click API](https://1click.chaindefuser.com)
- [NEAR Intents](https://docs.near.org/chain-abstraction/intents/overview)
