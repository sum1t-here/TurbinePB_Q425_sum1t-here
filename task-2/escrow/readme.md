# Anchor Escrow Program

A trustless token swap escrow smart contract built with Anchor on Solana.

## 🎯 Overview

An **escrow** is a temporary, trustless "middleman" smart contract that facilitates peer-to-peer token swaps without requiring trust between parties. The contract holds tokens from a **maker (seller)** until a **taker (buyer)** fulfills the trade conditions. When the trade completes, the escrow releases tokens to both parties. If no one takes the trade, the maker can refund their tokens.

This prevents scams — neither side can cheat because the contract enforces all rules on-chain.

---

## 🧩 Key Roles & Accounts

### Participants

| Role | Description | Actions |
|------|-------------|---------|
| **Maker** | Person creating the trade offer | Deposits Token A into escrow, sets desired Token B amount |
| **Taker** | Person accepting the trade | Sends Token B and receives Token A |
| **Escrow PDA** | Program-owned account | Stores trade metadata and controls the vault |
| **Vault ATA** | Token account owned by Escrow PDA | Temporarily holds the Maker's deposited tokens |

### On-Chain Accounts

| Account | Owner | Purpose |
|---------|-------|---------|
| **Escrow PDA** | Program | Stores metadata: maker, mints, amounts, bump seed |
| **Vault ATA** | Escrow PDA | Holds the tokens offered by Maker |
| **Maker ATA A/B** | Maker | Maker's token accounts (A = offered, B = received) |
| **Taker ATA A/B** | Taker | Taker's token accounts (A = received, B = offered) |

---

## 🔄 Program Instructions

### 1. **Initialize** — Maker creates the trade

```rust
pub fn initialize(ctx: Context<Make>, seed: u64, deposit: u64, receive: u64)
```

**What happens:**
1. Creates/initializes an **Escrow PDA** with the provided `seed`
2. Transfers `deposit` amount of Token A from maker's account → vault ATA
3. Stores trade metadata in Escrow account:
   - Maker's public key
   - Token A mint (offered)
   - Token B mint (requested)
   - Deposit and receive amounts
   - PDA bump seed

**Result:** Maker's tokens are locked in the vault — they cannot be withdrawn directly.

**Example:**
> "I want to deposit 100 USDC (Token A) and receive 2 SOL (Token B)"

---

### 2. **Take** — Taker completes the trade

```rust
pub fn take(ctx: Context<Take>)
```

**What happens:**
1. Transfers `receive` amount of Token B from Taker → Maker
2. Transfers `deposit` amount of Token A from vault → Taker
3. Closes the Escrow account and vault after trade completes

**Result:** Both parties have successfully swapped tokens — escrow is complete.

**Example:**
> "I accept! I'll send 2 SOL and receive 100 USDC"

---

### 3. **Refund** — Maker cancels the trade

```rust
pub fn refund(ctx: Context<Refund>)
```

**What happens:**
1. PDA signs (using seed derivation) and transfers all tokens from vault → Maker's ATA
2. Closes the vault and escrow account to reclaim rent

**Result:** Maker recovers their tokens and the escrow PDA is cleaned up.

**Example:**
> "No one took my offer, I want my tokens back"

---

## 🔒 Security & Authorization

| Action | Signer | Reason |
|--------|--------|--------|
| Initialize trade | Maker | They're depositing tokens and creating the offer |
| Transfer vault tokens | PDA (via seeds) | Only the program can authorize vault transfers |
| Complete trade | Taker | They're sending their tokens to fulfill the swap |
| Refund trade | PDA (via seeds) | Escrow PDA must authorize returning tokens |

### PDA Signer Seeds

The Escrow PDA uses these seeds to sign transactions:

```rust
[
    b"escrow",
    maker.key.as_ref(),
    seed.to_le_bytes(),
    &[bump]
]
```

This allows the PDA to act as a signer for its own vault operations.

---

## 🔄 Complete Trade Lifecycle

```
1. INITIALIZE
   Maker → [100 Token A] → Vault (locked)
   
2. TAKE
   Taker → [2 Token B] → Maker
   Vault → [100 Token A] → Taker
   ✅ Trade Complete, Escrow Closed

OR

2. REFUND
   Vault → [100 Token A] → Maker (returned)
   ✅ Trade Cancelled, Escrow Closed
```

---

## 🧪 Testing

The test suite demonstrates the full program functionality:

### Setup Phase
1. Airdrops SOL to maker and taker for transaction fees
2. Creates two token mints: `mintA` and `mintB`
3. Mints tokens to both users and creates their ATAs
4. Derives the escrow PDA and vault ATA addresses

### Test 1: Initialize
- Maker calls `initialize(seed, depositAmount, receiveAmount)`
- Program locks Maker's Token A into vault
- Verifies escrow state and balances

### Test 2: Take
- Taker calls `take()`
- Tokens are swapped (A from vault → taker, B from taker → maker)
- Escrow is closed
- Verifies final balances

### Test 3: Refund
- Maker re-initializes a new escrow
- Maker calls `refund()`
- Vault tokens are returned to maker
- Escrow is closed
- Verifies balances restored

---

## 📋 Prerequisites

- Rust and Cargo installed
- Solana CLI tools
- Anchor framework (`anchor-cli`)
- Node.js and Yarn/NPM

---

## 🚀 Getting Started

### Build the program
```bash
anchor build
```

### Run tests
```bash
anchor test
```

### Deploy to devnet
```bash
anchor deploy --provider.cluster devnet
```
---

## 🔐 Security Considerations

1. **PDA Authority**: The escrow PDA is the sole authority over the vault
2. **Atomic Swaps**: Both sides of the trade execute in one transaction (no partial trades)
3. **Rent Reclamation**: Accounts are properly closed to return rent to users
4. **Signer Verification**: All critical operations verify correct signers
5. **Single-Use Escrows**: Each escrow is one-time use (closes after take/refund)

---

## 📚 Key Concepts

### Program Derived Addresses (PDAs)
- Deterministic addresses derived from seeds
- Can sign transactions programmatically
- Used here to control the vault account

### Associated Token Accounts (ATAs)
- Standard way to hold SPL tokens
- Deterministically derived for each (wallet, mint) pair
- Automatically created if needed

### Cross-Program Invocations (CPIs)
- Allows programs to call other programs
- Used here to interact with Token Program
- Requires proper signer seeds for PDA signing

---