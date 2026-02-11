# Shield Contract Deployment Guide

## Prerequisites
- Linux/macOS (near-sdk-js WASM build requires native toolchain)
- Node.js 20+
- NEAR CLI (`npm i -g near-cli`)

## 1. Build WASM

```bash
cd packages/shield-contract
npm install
npx near-sdk-js build src/escrow.ts build/escrow.wasm
```

Or use GitHub Actions: push to `packages/shield-contract/` triggers automatic build.

## 2. Create NEAR Account

```bash
# Create a named account (needs a funding account)
near create-account shield-escrow.near --masterAccount your-account.near --initialBalance 5
```

## 3. Deploy Contract

```bash
near deploy shield-escrow.near build/escrow.wasm
```

## 4. Initialize

```bash
near call shield-escrow.near init '{"admin":"something_special777.tg"}' --accountId shield-escrow.near
```

## 5. Register Storage on USDC Contract

The escrow contract needs storage registration on the USDC token contract to receive and send USDC.

```bash
# USDC contract on NEAR mainnet
USDC=17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1

# Register storage for escrow contract
near call $USDC storage_deposit '{"account_id":"shield-escrow.near"}' \
  --accountId shield-escrow.near \
  --deposit 0.00125

# Also register storage for the merchant (seller) if not already registered
near call $USDC storage_deposit '{"account_id":"something_special777.tg"}' \
  --accountId something_special777.tg \
  --deposit 0.00125
```

## 6. Create HOT Pay Item

In the HOT Pay merchant dashboard:
1. Create a new payment item
2. Set receiver: `shield-escrow.near`
3. Set token: USDC
4. Set amount: 1 USDC (or flexible)
5. Copy the `item_id`
6. Set `VITE_ESCROW_HOT_PAY_ITEM_ID` in `demo/.env`

## 7. Verify

```bash
# Should return 0
near view shield-escrow.near get_escrow_count

# Should return admin account
near view shield-escrow.near get_admin
```

## 8. Test Escrow Flow

```bash
# Send 1 USDC to escrow with msg
near call $USDC ft_transfer_call \
  '{"receiver_id":"shield-escrow.near","amount":"1000000","msg":"{\"seller\":\"something_special777.tg\",\"description\":\"Test\",\"timeout_minutes\":5}"}' \
  --accountId your-buyer-account.near \
  --depositYocto 1 \
  --gas 100000000000000

# Check escrow was created
near view shield-escrow.near get_escrow '{"escrow_id":"escrow_0"}'

# Confirm delivery (as buyer)
near call shield-escrow.near confirm_delivery '{"escrow_id":"escrow_0"}' \
  --accountId your-buyer-account.near \
  --depositYocto 1 \
  --gas 100000000000000
```
