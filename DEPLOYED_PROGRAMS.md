# Deployed Programs on Aleo Testnet Beta

**Deployment Date**: January 27, 2026

---

## 📦 Deployed Programs

### 1. Credit Score Program
- **Program Name**: `credit_score.aleo`
- **Transaction ID**: `at14j9dpw29vdxr2s90w7uzdqnu6rluswwd4066pvf33rvljawct59qc8ywhk`
- **Explorer Link**: https://explorer.aleo.org/transaction/at14j9dpw29vdxr2s90w7uzdqnu6rluswwd4066pvf33rvljawct59qc8ywhk
- **Features**:
  - Private credit scoring (300-850 range)
  - ZK range proofs (`prove_score_threshold`)
  - Dynamic collateral calculation
  - Initialize credit profiles (starting score: 600)

### 2. Loan Manager Program
- **Program Name**: `loan_managerv1.aleo`
- **Transaction ID**: `at19n5d8vgvsp3puzhuxdd6rx6s7qmygv4jm0q97e5rs992ffuqmcgs7xtl9a`
- **Explorer Link**: https://explorer.aleo.org/transaction/at19n5d8vgvsp3puzhuxdd6rx6s7qmygv4jm0q97e5rs992ffuqmcgs7xtl9a
- **Features**:
  - Undercollateralized loans (50-150% collateral)
  - Payment processing
  - Default handling
  - Imports `credit_score.aleo` for verification

### 3. Payment Tracker Program
- **Program Name**: `payment_trackerv1.aleo`
- **Transaction ID**: `at1flq7kfjqflkgfqff29n7aets4cet6sl3drx922te5epdwc9zvugqfgkspy`
- **Explorer Link**: https://explorer.aleo.org/transaction/at1flq7kfjqflkgfqff29n7aets4cet6sl3drx922te5epdwc9zvugqfgkspy
- **Features**:
  - Private payment history (circular buffer of 24 payments)
  - Merkle root verification
  - Payment statistics generation

---

## 🔍 Verification

### Check Deployment Status

Visit the explorer links above to verify:
- ✅ Programs are deployed and confirmed
- ✅ Transactions are finalized
- ✅ Mappings are initialized

### Test on Playground

You can also test the programs on Leo Playground:
1. Visit https://play.leo-lang.org/
2. Import the program using the transaction ID
3. Run transitions to test functionality

---

## 🚀 Frontend Configuration

The frontend has been configured to connect to these deployed programs:

```bash
VITE_CREDIT_SCORE_PROGRAM=credit_score.aleo
VITE_LOAN_MANAGER_PROGRAM=loan_managerv1.aleo
VITE_PAYMENT_TRACKER_PROGRAM=payment_trackerv1.aleo
```

### Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Then visit `http://localhost:5173`

---

## 📊 Program Interactions

### Initialize Credit Profile
```typescript
// Call credit_score.aleo::initialize_credit
const creditProfile = await executeProgram(
  'credit_score.aleo',
  'initialize_credit',
  [userAddress]
);
```

### Prove Credit Score Threshold
```typescript
// ZK proof: prove score >= 650 without revealing exact score
const proof = await executeProgram(
  'credit_score.aleo',
  'prove_score_threshold',
  [creditProfile, 650]
);
// Returns: true/false (score remains private!)
```

### Apply for Loan
```typescript
// Call loan_managerv1.aleo::apply_for_loan
const loan = await executeProgram(
  'loan_managerv1.aleo',
  'apply_for_loan',
  [creditProfile, principalAmount, collateralAmount, termBlocks, interestRate]
);
```

---

## 🎯 Next Steps

1. **Install Leo Wallet**: https://leo.app/
2. **Get Testnet Credits**: https://faucet.aleo.org/
3. **Connect Wallet to Frontend**: Click "Connect Wallet" button
4. **Initialize Credit Profile**: Click "Create Credit Profile"
5. **Apply for First Loan**: Use the loan application form
6. **Make Payments**: Build your credit score!

---

## 🔐 Privacy Features

All deployed programs maintain complete privacy:
- **Credit scores**: Encrypted on-chain, only visible to owner
- **Loan terms**: Private between borrower and lender
- **Payment history**: Stored with Merkle verification
- **ZK proofs**: Prove properties without revealing data

Check the blockchain explorer - you'll see encrypted ciphertext, not plaintext! 🔒

---

**🎉 Your Private Credit Score system is now LIVE on Aleo testnet beta!**
