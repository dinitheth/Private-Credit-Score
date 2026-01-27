// Aleo program IDs (deployed on testnet beta)
export const CREDIT_SCORE_PROGRAM = import.meta.env.VITE_CREDIT_SCORE_PROGRAM || 'credit_score.aleo';
export const LOAN_MANAGER_PROGRAM = import.meta.env.VITE_LOAN_MANAGER_PROGRAM || 'loan_managerv1.aleo';
export const PAYMENT_TRACKER_PROGRAM = import.meta.env.VITE_PAYMENT_TRACKER_PROGRAM || 'payment_trackerv1.aleo';

// Transaction IDs for deployed programs
export const CREDIT_SCORE_TX = import.meta.env.VITE_CREDIT_SCORE_TX || 'at14j9dpw29vdxr2s90w7uzdqnu6rluswwd4066pvf33rvljawct59qc8ywhk';
export const LOAN_MANAGER_TX = import.meta.env.VITE_LOAN_MANAGER_TX || 'at19n5d8vgvsp3puzhuxdd6rx6s7qmygv4jm0q97e5rs992ffuqmcgs7xtl9a';
export const PAYMENT_TRACKER_TX = import.meta.env.VITE_PAYMENT_TRACKER_TX || 'at1flq7kfjqflkgfqff29n7aets4cet6sl3drx922te5epdwc9zvugqfgkspy';

// Network configuration
export const ALEO_NETWORK = import.meta.env.VITE_ALEO_NETWORK || 'testnet';
export const ALEO_API_URL = import.meta.env.VITE_ALEO_API_URL || 'https://api.explorer.provable.com/v1';
export const EXPLORER_URL = import.meta.env.VITE_EXPLORER_URL || 'https://explorer.aleo.org';

// Credit score ranges
export const CREDIT_SCORE_MIN = 300;
export const CREDIT_SCORE_MAX = 850;
export const CREDIT_SCORE_DEFAULT = 600;

// Credit score tiers
export const CREDIT_TIERS = [
    { min: 800, max: 850, label: 'Excellent', color: '#10b981', collateral: 50 },
    { min: 700, max: 799, label: 'Good', color: '#3b82f6', collateral: 75 },
    { min: 650, max: 699, label: 'Fair', color: '#f59e0b', collateral: 100 },
    { min: 600, max: 649, label: 'Poor', color: '#ef4444', collateral: 125 },
    { min: 300, max: 599, label: 'Very Poor', color: '#dc2626', collateral: 150 },
];

// Loan terms (in blocks)
// Assuming ~60 blocks per hour on Aleo testnet
export const LOAN_TERMS = [
    { label: '30 days', blocks: 43200 },   // 30 * 24 * 60
    { label: '60 days', blocks: 86400 },   // 60 * 24 * 60
    { label: '90 days', blocks: 129600 },  // 90 * 24 * 60
    { label: '180 days', blocks: 259200 }, // 180 * 24 * 60
];

// Interest rates (in basis points)
export const INTEREST_RATES = [
    { scoreMin: 800, rate: 500 },  // 5% for excellent credit
    { scoreMin: 700, rate: 750 },  // 7.5% for good credit
    { scoreMin: 650, rate: 1000 }, // 10% for fair credit
    { scoreMin: 600, rate: 1250 }, // 12.5% for poor credit
    { scoreMin: 300, rate: 1500 }, // 15% for very poor credit
];

// Payment statuses
export const PAYMENT_STATUS = {
    ON_TIME: 0,
    LATE: 1,
    DEFAULT: 2,
} as const;

// Loan statuses
export const LOAN_STATUS = {
    ACTIVE: 0,
    PAID_OFF: 1,
    DEFAULTED: 2,
} as const;

// Transaction timeout (ms)
export const TX_TIMEOUT = 60000;

// Polling interval for transaction status (ms)
export const POLL_INTERVAL = 2000;
