# Architecture

## HOT Pay Integration Overview

NADO DEX acts as a **HOT Pay merchant** -- accepting deposits from 50+ tokens across 20+ chains through HOT Pay's non-custodial payment gateway.

```
User (Telegram / HOT Wallet)
  - Has USDT on Ethereum, SOL on Solana, TON, etc.
       |
       v
HOT Pay Gateway
  - Auto-detect HOT environment
  - Connect wallet (MPC signer, no seed phrase)
  - Select source token + chain
       |
       v
NEAR Intents (1Click API)
  - Decentralized solver network
  - Solvers compete for best rate
  - Settlement via NEAR OmniBridge
       |
       v
NADO DEX (Ink Sepolia)
  - Receives USDT0 (ERC20)
  - approve() + depositCollateral()
  - User starts trading
```

Three integration paths:
1. **HOT Pay Embedded Checkout** -- `@hot-labs/kit` with full multi-chain wallet + exchange UI
2. **Custom Integration** -- `@hot-wallet/sdk` + 1Click API for complete UI control
3. **Pay Links** -- URL-based payment for external referrals

NADO implements paths 1 (demo app) and 2 (production DEX).

## System Overview

```
                    +-----------------------+
                    |   Telegram Mini App   |
                    |   (User Interface)    |
                    +----------+------------+
                               |
                    +----------v------------+
                    |    HOT Wallet SDK     |
                    |  @hot-wallet/sdk      |
                    |                       |
                    |  - EIP-6963 announce  |
                    |  - MPC signer         |
                    |  - setupEthProvider() |
                    +----------+------------+
                               |
                    +----------v------------+
                    |   Reown AppKit        |
                    |   (Wallet Discovery)  |
                    |                       |
                    |  Auto-discovers HOT   |
                    |  via EIP-6963 event   |
                    +----------+------------+
                               |
                    +----------v------------+
                    |   wagmi v2            |
                    |   (Connector Layer)   |
                    |                       |
                    |  useAccount()         |
                    |  useWriteContract()   |
                    |  useSignTypedData()   |
                    +----------+------------+
                               |
              +----------------+----------------+
              |                                 |
   +----------v-----------+          +----------v-----------+
   |   NADO DEX Client    |          |   NADO Server        |
   |                      |          |                      |
   |  - Auth (JWT)        |   API   |  - Auth middleware    |
   |  - Portfolio         +--------->  - NADO Gateway       |
   |  - Trade             |          |  - Bot engine        |
   |  - Deposit/Withdraw  |   WS    |  - WebSocket relay   |
   |                      <----------+                      |
   +----------+-----------+          +----------+-----------+
              |                                 |
   +----------v-----------+          +----------v-----------+
   |   Ink Sepolia        |          |   NADO Gateway       |
   |   (EVM Chain)        |          |   (Upstream DEX)     |
   |                      |          |                      |
   |  - USDT0 (ERC20)     |          |  - Orderbook         |
   |  - Endpoint contract |          |  - Matching engine   |
   |  - Multicall3        |          |  - Settlements       |
   +----------------------+          +----------------------+
```

## HOT Protocol Layer (NEAR)

> See [MPC Signing Flow](https://docs.hotdao.ai/mpc-wallet/signature-generation-via-mpc) for full details.

```
   HOT Wallet User
         |
         v
   HOT MPC Signer (Decentralized)
   - Validators stake HOT tokens
   - TEE-backed signing
   - End-to-end encrypted
   - ECDSA (EVM, BTC, BNB) + EdDSA (Solana, NEAR, Polkadot)
         |
         v
   NEAR Chain Signatures
   - Key management on NEAR
   - Multi-chain derivation via Key Derivation Function
   - 100+ chains supported
   - wallet_id = 32-byte hash of user identity (chain-agnostic)
         |
    +----+----+----+----+
    |    |    |    |    |
   EVM  SOL  TON  BTC  ...
```

### MPC Authorization Flow

1. User submits signature request (`uid`, `message`, `proof`)
2. MPC network validates the proof
3. Account registry queried for stored authorization methods
4. Each auth method verified via view function on respective chain
5. Upon success, MPC network executes signing protocol
6. Signature returned to user

> "Only messages explicitly authorized by the user are signed -- not arbitrary requests." -- [HOT Docs](https://docs.hotdao.ai/mpc-wallet/signature-generation-via-mpc)

## Connection Flow

```
1. App loads in Telegram/HOT browser
   └── @hot-wallet/sdk imported (side effect)
       └── EIP-6963: announceProvider("HOT Wallet", rdns: "org.hot-labs")

2. WalletProvider Phase 1 (lightweight)
   └── isInsideHotWallet() → true → skip 2s delay → load AppKit

3. WalletProvider Phase 2 (AppKit loaded)
   └── AppKit listens for eip6963:announceProvider
       └── Discovers "HOT Wallet" provider

4. useHotPay hook activates
   └── HOT.isInjected → true
       └── find connector by name "HOT Wallet"
           └── connect({ connector: hotConnector })

5. wagmi useAccount() → { isConnected: true, address: "0x..." }
   └── useAuth → POST /api/auth/wallet → JWT token
       └── usePortfolio → GET /api/account/portfolio-batch
           └── accountStore hydrated → UI renders portfolio

6. User deposits USDT0
   └── useDeposit → writeContractAsync(approve)
       └── HOT MPC signer signs approve tx
           └── writeContractAsync(depositCollateral)
               └── HOT MPC signer signs deposit tx
                   └── Both txs confirmed on Ink Sepolia
```

## Deposit Flow

```
User clicks "Deposit"
     |
     v
DepositModal opens
     |
     v  (if HOT connected)
HotPayOption shown ─── "Depositing via HOT Wallet | NEAR: abc..."
     |
     v
User enters amount, clicks "Deposit to NADO"
     |
     v
useDeposit.deposit(amount)
     |
     ├── Step 1: approve(ENDPOINT, amount)
     │   └── HOT provider.request({ method: "eth_sendTransaction", ... })
     │       └── HOT MPC signer signs → tx hash
     │           └── waitForTransactionReceipt(hash)
     │
     └── Step 2: depositCollateral(subaccount, productId, amount)
         └── HOT provider.request({ method: "eth_sendTransaction", ... })
             └── HOT MPC signer signs → tx hash
                 └── waitForTransactionReceipt(hash)
                     └── Success! Balance updated.
```

## Cross-Chain Bridge Flow (NEAR Intents)

```
User has USDT on Ethereum/Arbitrum/Solana/etc
     |
     v
IntentsBridgeWidget / BridgeTab
  - Select source chain + token
  - Enter amount
     |
     v
1Click API: POST /v0/quote (dry: true)
  - NEAR Intents solver network competes
  - Returns: amountOut, timeEstimate, depositAddress
     |
     v
User reviews quote, clicks "Bridge"
     |
     v
HOT MPC signer: eth_sendTransaction to deposit address
  - Signs via NEAR Chain Signatures
  - No seed phrase needed
     |
     v
NEAR Intents: Market Makers compete to fill
  - Decentralized cross-chain settlement
  - ~1-5 min execution time
     |
     v
Tokens arrive on destination chain
     |
     v
approve + depositCollateral (existing deposit flow)
     |
     v
User trading on NADO
```

### 1Click API Integration

We use the [1Click API](https://1click.chaindefuser.com) (NEAR Intents' official swap API) directly via `fetch()`:
- `POST /v0/quote` -- Get bridge quote with best solver rate
- `GET /v0/status` -- Poll swap execution status
- `POST /v0/deposit/submit` -- Notify about deposit transaction

Supported source chains: Ethereum, Arbitrum, Base, Solana, BNB, NEAR, TON

### Testnet Strategy

1Click API works on mainnet only. NADO runs on Ink Sepolia (testnet).

**Solution for hackathon**: Quotes via `dry: true` show live mainnet prices and routes. Bridge button explains that execution is available on mainnet deployment. Deposit flow works fully on testnet via Mint + direct deposit.

## Key Design Decisions

1. **EIP-6963 over custom connector**: HOT SDK already announces via EIP-6963 (rdns: `org.hot-labs`), so Reown AppKit auto-discovers it. No need for a separate wagmi connector in the NADO integration. See [HOT SDK README](https://github.com/hot-dao/hot-sdk-js) -- "wallet-selector libraries automatically detect the HOT wallet provider."

2. **setupEthProvider() is critical**: Without it, read-only RPC calls (eth_call, eth_getBalance) fail because HOT provider only handles signing methods natively. Per [HOT SDK docs](https://github.com/hot-dao/hot-sdk-js): "hotProvider implements methods that require a private key signature. All other methods must be implemented using your own RPC."

3. **Instant load in HOT**: `isInsideHotWallet()` check in WalletProvider skips the 2-second deferred loading, providing instant connection inside HOT/Telegram.

4. **Existing deposit flow unchanged**: Since HOT provides a standard EIP-1193 provider, all existing wagmi hooks (writeContractAsync, useReadContract) work without modification.

5. **Standalone package for reuse**: The `@nado-hot-bridge/connector` package can be used by any wagmi-based dApp, not just NADO.

6. **`@hot-wallet/sdk` over `@hot-labs/kit`**: We use the lower-level SDK because NADO already has wagmi + Reown AppKit. [HOT Kit](https://docs.hotdao.ai/hot-kit) (`@hot-labs/kit`) is a higher-level toolkit with built-in UI/exchange that would replace the existing wallet stack -- overkill for an integration into an existing dApp.

7. **1Click API over `@hot-labs/kit` for bridging**: Direct `fetch()` to `https://1click.chaindefuser.com` instead of kit's `Intents.builder()`. Reasons: zero dependencies (no ethers.js/MobX), full UI control, demonstrates deep understanding of NEAR Intents protocol for judges.

8. **Tab-based UX in NADO**: DepositModal has "Direct Deposit" and "Bridge from Any Chain" tabs. After bridge completes, automatically switches to direct deposit tab for seamless flow.

## References

- [HOT Protocol Overview](https://docs.hotdao.ai/)
- [HOT Wallet SDK](https://github.com/hot-dao/hot-sdk-js)
- [HOT Kit](https://github.com/hot-dao/hot-connector)
- [MPC Signing](https://docs.hotdao.ai/mpc-wallet/signature-generation-via-mpc)
- [HOT Whitepaper](https://arxiv.org/abs/2512.02287)
- [NEAR Chain Abstraction](https://docs.near.org/chain-abstraction/intents/overview)
