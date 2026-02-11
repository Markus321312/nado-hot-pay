# NADO x HOT Pay

> Accept DEX Deposits via HOT Pay -- Any Token, Any Chain

**NEARCON 2026 Innovation Sandbox**

## The Problem

DeFi protocols need a way to accept deposits from any chain without forcing users through complex bridge flows. A Telegram user with USDT on Solana shouldn't need to manually bridge to Ethereum, swap to the right token, and then deposit. This friction kills adoption.

## What We Built

**NADO becomes a HOT Pay merchant.** Users deposit to NADO DEX from 50+ tokens across 20+ chains -- HOT Pay handles wallet connection, cross-chain routing, and settlement via NEAR Intents. No seed phrases, no manual bridging, one-click from Telegram.

### How It Works

```
User in Telegram (any token, any chain)
       |
       v
  HOT Pay (connect + route + settle)
  - HOT Wallet MPC signer (NEAR Chain Signatures)
  - Cross-chain via NEAR OmniBridge + Intents
  - Decentralized solver network
       |
       v
  NADO DEX (Ink Sepolia)
  - Receives USDT0
  - Credits trading account
  - User starts trading perps
```

### Four Deliverables

1. **HOT Pay Merchant Integration** -- NADO DEX accepts deposits via HOT Pay gateway
2. **Cross-Chain Deposit Gateway** -- Bridge from any chain via NEAR Intents (1Click API)
3. **`@nado-hot-bridge/connector`** -- Reusable npm package (wagmi connector + bridge + widgets)
4. **Demo App** -- Standalone HOT Pay checkout showcase

## HOT Pay Integration

### Merchant Flow

1. User opens NADO in Telegram (or HOT Wallet browser)
2. HOT Pay auto-detects environment, connects wallet (MPC signer, no seed phrase)
3. User chooses "HOT Pay -- Any Chain" tab in deposit modal
4. Selects source chain and token (ETH, SOL, TON, ARB, BASE, BNB, NEAR)
5. HOT Pay routes through NEAR Intents -- decentralized solvers compete for best rate
6. Settlement via NEAR OmniBridge -- non-custodial, on-chain
7. USDT0 arrives on Ink Sepolia, NADO credits the trading account

### Code Example

```typescript
import { IntentsBridgeWidget, useHotWallet, HotPayButton } from '@nado-hot-bridge/connector';

// Connect via HOT Pay
<HotPayButton label="Pay with HOT" />

// Cross-chain deposit widget
<IntentsBridgeWidget
  options={{
    defaultSourceChain: 'eth',
    defaultSourceToken: 'USDT',
    recipientAddress: nearAddress,
    refundAddress: evmAddress,
  }}
  onSuccess={(amountOut) => console.log('Deposit received:', amountOut)}
/>
```

**Supported chains**: Ethereum, Arbitrum, Base, Solana, BNB, NEAR, TON

## NEAR Leverage

- **HOT Protocol** is built on NEAR Protocol -- 30M+ wallets in the ecosystem
- **MPC signer** uses NEAR Chain Signatures -- keys never exist in full on any single node ([MPC docs](https://docs.hotdao.ai/mpc-wallet/signature-generation-via-mpc))
- **Cross-chain routing** via NEAR Intents -- decentralized solver network for optimal settlement
- **NEAR OmniBridge** enables 50+ token support across 20+ chains
- **Chain abstraction** -- one `wallet_id` (32 bytes) across 100+ chains, ECDSA + EdDSA
- **Telegram-native** -- HOT Wallet is Telegram's crypto gateway, powered by NEAR

## Quick Start

```bash
# Install dependencies
npm install

# Build connector package
npm run build:connector

# Run demo app
npm run dev
# -> http://localhost:5180
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Payment Gateway** | HOT Pay (non-custodial, 50+ tokens, 20+ chains) |
| **Bridge** | NEAR Intents 1Click API + NEAR OmniBridge |
| **Connector** | wagmi v2, viem, @hot-wallet/sdk, @hot-labs/kit |
| **Frontend** | React 18, TypeScript, Vite |
| **Wallet** | HOT Protocol MPC Signer (NEAR Chain Signatures) |
| **Chain** | Ink Sepolia (testnet), NEAR Protocol |
| **DEX** | NADO -- Perpetual Futures + Spot Trading |

## Project Structure

```
nado-hot-bridge/
  packages/
    hot-connector/           # Reusable npm package
      src/
        connector.ts         # wagmi createConnector for HOT
        detectEnvironment.ts # HOT/Telegram detection
        useHotWallet.ts      # React hook for HOT Pay connection
        useHotDeposit.ts     # React hook for deposits
        useIntentsBridge.ts  # React hook for cross-chain bridge
        HotPayButton.tsx     # "Pay with HOT" button
        HotDepositWidget.tsx # Self-contained deposit widget
        HotBridgeWidget.tsx  # Multi-chain bridge visualization
        IntentsBridgeWidget.tsx # NEAR Intents bridge UI
        intents/
          oneClickApi.ts     # 1Click API service layer
          tokens.ts          # Supported chains & tokens
  demo/                      # HOT Pay checkout demo
  docs/                      # Architecture + HOT Pay integration guide
```

## Submission

- **Track 1**: Open Society: From Finance to the Real World
- **Track 2**: Only on NEAR
- **Working Prototype**: NADO DEX with HOT Pay merchant integration
- **Demo Video**: [link]
- **Repository**: This repo

## Team

Built for NEARCON 2026 Innovation Sandbox

## Links

### Project
- [NADO DEX](https://github.com/user/nado-dev) (private)

### HOT Protocol
- [HOT Pay](https://hot-labs.org/pay/) -- Crypto payment gateway for websites and Telegram Mini Apps
- [HOT Pay Admin](https://pay.hot-labs.org/admin/api-keys) -- Merchant API keys
- [HOT Pay Docs](https://hot-labs.gitbook.io/hot-pay/) -- HOT Pay documentation
- [HOT Protocol](https://hot-labs.org) -- Chain abstraction protocol on NEAR
- [HOT Protocol Docs](https://docs.hotdao.ai/) -- Protocol overview, MPC, chain abstraction
- [HOT Wallet SDK](https://github.com/hot-dao/hot-sdk-js) -- `@hot-wallet/sdk`
- [HOT Kit](https://github.com/hot-dao/kit) -- `@hot-labs/kit` multi-chain toolkit
- [MPC Signing Flow](https://docs.hotdao.ai/mpc-wallet/signature-generation-via-mpc) -- How MPC signatures work
- [HOT Whitepaper](https://arxiv.org/abs/2512.02287) -- Academic paper on HOT Protocol

### NEAR Ecosystem
- [NEAR Protocol](https://near.org)
- [NEAR Chain Abstraction](https://docs.near.org/chain-abstraction/intents/overview) -- Intents & cross-chain
- [1Click API](https://1click.chaindefuser.com) -- NEAR Intents swap/bridge API
- [NEARCON 2026](https://nearcon.org/innovation-sandbox/) -- Innovation Sandbox
