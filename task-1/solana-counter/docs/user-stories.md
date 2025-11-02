# User Stories: Solana Counter

## Overview
A public counter application on Solana blockchain where anyone can increment/decrement the counter, with reset controlled by the creator.

---

## User Stories

### 1️⃣ Initialize Personal Counter

**As a** user  
**I want to** create a public counter account  
**So that** I can track numerous activities (Event Attendance / Participation Tracker, Community Goal Tracker etc. ) on-chain

#### Acceptance Criteria
- I can initialize a counter account with my wallet
- The counter starts at zero (0)
---

### 2️⃣ Increment Counter

**As a** user  
**I want to** increase my counter by 1  
**So that** I can track upward progress

#### Acceptance Criteria
- Counter is incremented by 1
- Every other user can increment my counter

---

### 3️⃣ Decrement Counter

**As a** user  
**I want to** decrease my counter by 1  
**So that** I can track downward progress

#### Acceptance Criteria
- Counter is decremented by 1
- Every other user can decrement my counter

---

### 3️⃣ Reset Counter

**As a** user  
**I want to** reset my counter to 0  
**So that** I can start fresh

#### Acceptance Criteria
- Counter is reset to 0
- Only I can reset my counter as it is tied to my wallet

---

## Quick Start

```bash
# Install dependencies
npm install

# Build the program
anchor build

# Run tests
anchor test
```

---

## Permissions

| Action | Who Can Execute |
|--------|----------------|
| **Initialize** | Wallet owner (creates counter) |
| **Increment** | Everyone |
| **Decrement** | Everyone |
| **Reset** | Counter creator / authority wallet |

---

## Key Features

✅ **Creator Control** - Only the counter creator can reset the counter
✅ **Collaborative** - Anyone can increment or decrement the counter
✅ **On-Chain** - Counter value stored permanently on Solana  
✅ **Simple** - Four basic operations: initialize, increment, decrement, reset