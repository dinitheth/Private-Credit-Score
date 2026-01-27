# Private Credit Score - Frontend

React + TypeScript frontend for the Private Credit Score system on Aleo.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- [Leo Wallet](https://leo.app/) browser extension
- Testnet credits from [Aleo Faucet](https://faucet.aleo.org/)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173`

---

## 🔧 Configuration

The frontend is pre-configured to connect to the deployed programs on Aleo testnet beta:

```
credit_score.aleo
loan_managerv1.aleo
payment_trackerv1.aleo
```

Environment variables are set in `.env` file.

---

## 📱 Features

### Credit Dashboard
- View your private credit score (300-850)
- Privacy toggle (show/hide exact score)
- Payment history and statistics
- Collateral ratio based on credit tier

### Loan Application
- Apply for loans with dynamic collateral (50-150%)
- Real-time eligibility checking
- Automatic collateral calculation based on credit score
- ZK proof generation for credit verification

### Active Loans
- View all active loans
- Make payments on loans
- Track repayment progress
- Overdue warnings

---

## 🎯 User Flow

1. **Connect Wallet**
   - Click "Connect Wallet" in header
   - Approve connection in Leo Wallet

2. **Initialize Credit Profile**
   - Click "Create Credit Profile"
   - Starting score: 600
   - Transaction confirms on-chain

3. **Apply for Loan**
   - Enter loan amount (10-1000 credits)
   - Select term (30/60/90/180 days)
   - System calculates required collateral
   - Submit application

4. **Make Payments**
   - Select active loan
   - Enter payment amount
   - Submit payment
   - Credit score updates automatically

---

## 🔐 Privacy Features

- **Encrypted State**: All credit data stored as ciphertext on-chain
- **ZK Range Proofs**: Prove score thresholds without revealing exact values
- **Privacy Toggle**: Show/hide your credit score in UI
- **Selective Disclosure**: Export view keys for auditors

---

## 🛠️ Development

### Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Dashboard.tsx
│   │   ├── CreditScoreCard.tsx
│   │   ├── LoanApplicationForm.tsx
│   │   └── ActiveLoans.tsx
│   ├── utils/
│   │   └── constants.ts
│   ├── App.tsx
│   ├── App.css
│   └── index.css
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## 🎨 UI/UX

### Design System
- **Dark theme** with vibrant gradients
- **Primary**: Indigo (#6366f1)
- **Secondary**: Purple (#8b5cf6)
- **Accent**: Green (#10b981)

### Components
- Modern card-based layout
- Smooth animations and transitions
- Responsive design (mobile-friendly)
- Loading states and error handling

---

## 🔗 Deployed Programs

- **credit_score.aleo**: `at14j9dpw29vdxr2s90w7uzdqnu6rluswwd4066pvf33rvljawct59qc8ywhk`
- **loan_managerv1.aleo**: `at19n5d8vgvsp3puzhuxdd6rx6s7qmygv4jm0q97e5rs992ffuqmcgs7xtl9a`
- **payment_trackerv1.aleo**: `at1flq7kfjqflkgfqff29n7aets4cet6sl3drx922te5epdwc9zvugqfgkspy`

---

## 📝 License

MIT
