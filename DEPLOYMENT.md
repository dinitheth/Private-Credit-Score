# Deployment Guide - Private Credit Score on Aleo Testnet

Complete guide for deploying the Private Credit Score system to Aleo testnet.

---

## Prerequisites

### 1. Install Leo Toolchain

**Option A: Via Cargo (Recommended)**
```bash
# Install Rust if not already installed
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Install Leo
cargo install --git https://github.com/ProvableHQ/leo leo-lang

# Verify installation
leo --version
```

**Option B: Build from Source**
```bash
# Clone Leo repository
git clone https://github.com/ProvableHQ/leo
cd leo

# Build and install
cargo install --path .
```

### 2. Create Aleo Account

```bash
# Generate new account
leo account new

# Output:
#  Private Key  APrivateKey1...
#  View Key    AViewKey1...
#  Address     aleo1...
```

**⚠️ IMPORTANT**: Save your private key securely! You'll need it for deployment.

### 3. Get Testnet Credits

1. Visit **Aleo Faucet**: https://faucet.aleo.org/
2. Connect your wallet or paste your address
3. Request credits (you'll need ~10-15 credits for all deployments)
4. Wait for transaction confirmation

**Verify Balance**:
```bash
# Check balance on explorer
# Visit: https://explorer.aleo.org/
# Search for your address
```

---

## Step 1: Deploy Leo Programs

### Deploy credit_score.leo

```bash
cd "c:\Users\User\Documents\Private Credit Score\credit_score"

# Build the program first
leo build

# Deploy to testnet
leo deploy --network testnet --private-key <YOUR_PRIVATE_KEY>
```

**Expected Output**:
```
✅ Deployed 'credit_score.aleo' to testnet
📝 Program ID: credit_score_v1_abc123.aleo
🔗 Transaction: at1...
```

**Save the Program ID** - you'll need it for frontend configuration!

**Common Errors**:
- `Insufficient balance`: Get more credits from faucet
- `Program already exists`: Change program name in `program.json`
- `Invalid private key`: Check key format (should start with `APrivateKey1`)

---

### Deploy loan_manager.leo

```bash
cd "../loan_manager"

# Update import to deployed credit_score program
# Edit src/main.leo:
# Line 9: import credit_score_v1_abc123.aleo;

leo build
leo deploy --network testnet --private-key <YOUR_PRIVATE_KEY>
```

**Expected Output**:
```
✅ Deployed 'loan_manager.aleo' to testnet
📝 Program ID: loan_manager_v1_xyz789.aleo
```

---

### Deploy payment_tracker.leo

```bash
cd "../payment_tracker"

leo build
leo deploy --network testnet --private-key <YOUR_PRIVATE_KEY>
```

**Expected Output**:
```
✅ Deployed 'payment_tracker.aleo' to testnet
📝 Program ID: payment_tracker_v1_def456.aleo
```

---

## Step 2: Configure Frontend

### Update Environment Variables

```bash
cd "../frontend"

# Create or update .env file
cat > .env << EOF
VITE_CREDIT_SCORE_PROGRAM=credit_score_v1_abc123.aleo
VITE_LOAN_MANAGER_PROGRAM=loan_manager_v1_xyz789.aleo
VITE_PAYMENT_TRACKER_PROGRAM=payment_tracker_v1_def456.aleo
VITE_ALEO_NETWORK=testnet
VITE_ALEO_API_URL=https://api.explorer.provable.com/v1
EOF
```

**Replace** the program IDs with your actual deployed program IDs from Step 1!

---

## Step 3: Install Frontend Dependencies

```bash
# Install Node.js dependencies
npm install

# If you encounter errors, try:
npm install --legacy-peer-deps
```

**Expected Packages**:
- React 18
- TypeScript
- Vite
- Aleo Wallet Adapter
- Provable SDK

---

## Step 4: Start Development Server

```bash
npm run dev
```

**Expected Output**:
```
  VITE v4.x.x  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Visit http://localhost:5173 in your browser.

---

## Step 5: Test the Application

### 5.1 Install Leo Wallet

1. Visit https://leo.app/
2. Install browser extension
3. Create or import wallet
4. Switch to **Testnet** network

### 5.2 Connect Wallet

1. Open http://localhost:5173
2. Click "Connect Wallet" button
3. Approve connection in Leo Wallet
4. Verify address displays in header

### 5.3 Initialize Credit Profile

1. Click "Create Credit Profile" button
2. Approve transaction in wallet
3. Wait for confirmation (~30 seconds)
4. Verify score: 600 appears

**Transaction will be visible on**:
https://explorer.aleo.org/transaction/YOUR_TX_ID

### 5.4 Apply for First Loan

1. Navigate to "Apply for Loan" section
2. Set amount: 100 credits
3. Select term: 30 days
4. Note required collateral (should be 125 credits for 600 score)
5. Click "Apply for Loan"
6. Approve transaction
7. Verify loan appears in "Active Loans"

### 5.5 Make a Payment

1. Select your active loan
2. Enter payment amount (e.g., 10 credits)
3. Click "Pay"
4. Approve transaction
5. Verify:
   - Loan balance decreased
   - Credit score increased (600 → 605)
   - Payment recorded

---

## Step 6: Verify Deployment

### Check on Blockchain Explorer

1. Visit https://explorer.aleo.org/
2. Search for your deployed programs:
   - `credit_score_v1_abc123.aleo`
   - `loan_manager_v1_xyz789.aleo`
   - `payment_tracker_v1_def456.aleo`

3. Verify:
   - ✅ Programs show as deployed
   - ✅ Transactions are confirmed
   - ✅ Mappings are created

### Test Privacy Features

#### Test 1: Verify Score is Private
1. Check your transaction on explorer
2. In transaction details, look for `CreditProfile` record
3. Should show **encrypted ciphertext**, not plaintext score ✅

#### Test 2: Generate ZK Proof
```typescript
// In browser console (when on dashboard)
const proof = await prove_score_threshold(creditProfile, 650);
console.log(proof); // Should return true/false without revealing score
```

#### Test 3: Check Public Mappings
1. Go to explorer → Programs → credit_score.aleo
2. View `verified_borrowers` mapping
3. Should show your address: `true` (but NOT your score) ✅

---

## Troubleshooting

### Issue: "Leo command not found"

**Solution**:
```bash
# Add cargo bin to PATH
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verify
leo --version
```

### Issue: "Insufficient credits for deployment"

**Solution**:
1. Check balance: https://explorer.aleo.org/
2. Request more from faucet: https://faucet.aleo.org/
3. Wait 5-10 minutes between requests

### Issue: "Program already exists"

**Solution**:
```bash
# Change program name in program.json
{
  "program": "credit_score_v2.aleo",  // Add version or unique identifier
  ...
}

# Rebuild and deploy
leo build
leo deploy --network testnet --private-key <KEY>
```

### Issue: "Wallet won't connect"

**Solution**:
1. Ensure Leo Wallet extension is installed
2. Switch wallet to Testnet network
3. Refresh browser
4. Clear wallet permissions and reconnect

### Issue: "Transaction pending forever"

**Solution**:
1. Check Aleo network status: https://status.aleo.org/
2. Wait up to 2-3 minutes (testnet can be slow)
3. If stuck >5 minutes, refresh and retry
4. Check transaction on explorer for error details

### Issue: "Frontend build errors"

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Or try with legacy peer deps
npm install --legacy-peer-deps

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

---

## Production Deployment (Optional)

### Build for Production

```bash
cd frontend
npm run build
```

Output will be in `dist/` folder.

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Deploy to Netlify

1. Visit https://app.netlify.com/
2. Drag `dist/` folder to deploy
3. Done!

---

## Post-Deployment Checklist

- [ ] All 3 Leo programs deployed successfully
- [ ] Program IDs saved and documented
- [ ] Frontend environment variables updated
- [ ] Wallet connection working
- [ ] Credit profile initialization tested
- [ ] Loan application tested
- [ ] Payment processing tested
- [ ] Privacy features verified on explorer
- [ ] Demo scenario documented

---

## Next Steps

1. **Test Extensively**: Try various scenarios (different loan amounts, payment delays, etc.)
2. **Document Issues**: Note any bugs or unexpected behavior
3. **Create Demo Video**: Record walkthrough for buildathon submission
4. **Prepare Presentation**: Highlight privacy features and technical innovations
5. **Gather Feedback**: Share with Aleo community on Discord

---

## Support & Resources

- **Aleo Discord**: https://discord.com/invite/aleo
- **Leo Documentation**: https://docs.leo-lang.org/
- **Aleo Developer Docs**: https://developer.aleo.org/
- **Explorer**: https://explorer.aleo.org/
- **Faucet**: https://faucet.aleo.org/

---

**🎉 Congratulations! Your Private Credit Score system is now live on Aleo testnet!**
