import { FC, useState, useEffect } from 'react';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { TrendingUp, Wallet, AlertCircle } from 'lucide-react';
import CreditScoreCard from './CreditScoreCard';
import LoanApplicationForm from './LoanApplicationForm';
import ActiveLoans from './ActiveLoans';
import { initializeCreditProfile, checkHasCreditProfile, getCreditProfileRecord } from '../utils/aleo';
import { ViewType } from '../App';

interface DashboardProps {
    currentView: ViewType;
}

interface CreditProfileData {
    score: number;
    payment_count: number;
    on_time_payments: number;
    late_payments: number;
    defaults: number;
    total_borrowed: number;
    total_repaid: number;
}

const Dashboard: FC<DashboardProps> = ({ currentView }) => {
    const wallet = useWallet();
    const { connected, publicKey } = wallet;
    const [hasCreditProfile, setHasCreditProfile] = useState(false);
    const [loading, setLoading] = useState(true);
    const [initializing, setInitializing] = useState(false);
    const [creditProfileData, setCreditProfileData] = useState<CreditProfileData | null>(null);
    const [creditProfileRecord, setCreditProfileRecord] = useState<any>(null);

    useEffect(() => {
        if (connected && publicKey) {
            // Check if user has initialized credit profile
            checkCreditProfileStatus();
        } else {
            setLoading(false);
        }
    }, [connected, publicKey]);

    const checkCreditProfileStatus = async () => {
        setLoading(true);
        try {
            const hasProfile = await checkHasCreditProfile(wallet);
            setHasCreditProfile(hasProfile);

            // If has profile, fetch the actual data
            if (hasProfile) {
                const profileRecord = await getCreditProfileRecord(wallet);
                if (profileRecord) {
                    // Parse the record data (structure depends on wallet adapter response)
                    console.log('Credit Profile Record:', profileRecord);
                    setCreditProfileRecord(profileRecord); // Store raw record
                    setCreditProfileData(profileRecord as any);
                }
            }
        } catch (error) {
            console.error('Error checking credit profile:', error);
            setHasCreditProfile(false);
        } finally {
            setLoading(false);
        }
    };

    const handleInitializeCreditProfile = async () => {
        setInitializing(true);
        try {
            console.log('Initializing credit profile on Aleo testnet beta...');
            const result = await initializeCreditProfile(wallet);
            console.log('Credit profile initialized successfully:', result);
            // Wait a moment for the transaction to be processed
            setTimeout(() => {
                setHasCreditProfile(true);
                setInitializing(false);
            }, 2000);
        } catch (error: any) {
            console.error('Error initializing credit profile:', error);
            setInitializing(false);
        }
    };

    if (!connected) {
        return (
            <div className="empty-state card">
                <div className="empty-state-icon">
                    <Wallet size={64} />
                </div>
                <h3>Connect Your Wallet</h3>
                <p>Connect your Aleo wallet to access the Private Credit Score platform</p>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 'var(--spacing-md)' }}>
                    <AlertCircle size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Your credit score and financial data remain completely private
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
                <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--text-muted)' }}>
                    Checking your credit profile on Aleo testnet...
                </p>
            </div>
        );
    }

    if (!hasCreditProfile) {
        return (
            <div className="empty-state card fade-in">
                <div className="empty-state-icon">
                    <TrendingUp size={64} />
                </div>
                <h3>Initialize Your Credit Profile</h3>
                <p>Start building your private credit history on Aleo</p>
                <button
                    className="btn btn-primary"
                    onClick={handleInitializeCreditProfile}
                    disabled={initializing}
                >
                    {initializing ? 'Processing...' : 'Create Credit Profile'}
                </button>
                <div style={{
                    marginTop: 'var(--spacing-lg)',
                    padding: 'var(--spacing-md)',
                    background: 'rgba(99, 102, 241, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(99, 102, 241, 0.3)'
                }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        <strong>Starting Credit Score: 600</strong><br />
                        Your score will improve with on-time payments and responsible borrowing.
                        All data remains encrypted and private to you.
                    </p>
                </div>
            </div>
        );
    }

    // Render different views based on currentView
    if (currentView === 'myloans') {
        return (
            <div className="dashboard-grid fade-in">
                <div style={{ gridColumn: '1 / -1' }}>
                    <ActiveLoans />
                </div>
            </div>
        );
    }

    if (currentView === 'apply') {
        return (
            <div className="dashboard-grid fade-in">
                <div style={{ gridColumn: '1 / -1' }}>
                    <CreditScoreCard />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                    <LoanApplicationForm />
                </div>
            </div>
        );
    }

    // Calculate derived values
    const score = creditProfileData?.score || 600;
    const totalPayments = creditProfileData?.payment_count || 0;
    const onTimeRate = totalPayments > 0
        ? Math.round((creditProfileData!.on_time_payments / totalPayments) * 100)
        : 0;

    // Calculate collateral ratio based on score
    let collateralRatio = 125;
    if (score >= 800) collateralRatio = 50;
    else if (score >= 700) collateralRatio = 75;
    else if (score >= 650) collateralRatio = 100;
    else if (score >= 600) collateralRatio = 125;
    else collateralRatio = 150;

    // Determine score tier
    let scoreTier = 'Poor';
    let scoreColor = 'var(--accent-coral)';
    if (score >= 750) {
        scoreTier = 'Excellent';
        scoreColor = 'var(--accent-green)';
    } else if (score >= 650) {
        scoreTier = 'Good';
        scoreColor = 'var(--accent-green)';
    } else if (score >= 500) {
        scoreTier = 'Fair';
        scoreColor = 'var(--accent-coral)';
    }

    // Default: Dashboard view - Compact overview with key metrics
    return (
        <div className="dashboard-grid fade-in">
            {/* Compact metrics grid */}
            <div style={{
                gridColumn: '1 / -1',
                display: 'grid',
                gap: 'var(--spacing-lg)',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
            }}>
                {/* Credit Score Card - Compact */}
                <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                        <TrendingUp size={20} style={{ color: 'var(--primary)' }} />
                        <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>Credit Score</h4>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: scoreColor }}>{score}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'var(--spacing-xs)' }}>{scoreTier}</div>
                </div>

                {/* Total Payments */}
                <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                        <TrendingUp size={20} style={{ color: 'var(--accent-green)' }} />
                        <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>Total Payments</h4>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{totalPayments}</div>
                </div>

                {/* On-Time Rate */}
                <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                        <TrendingUp size={20} style={{ color: 'var(--accent-green)' }} />
                        <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>On-Time Rate</h4>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>{onTimeRate}%</div>
                </div>

                {/* Collateral Ratio */}
                <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                        <AlertCircle size={20} style={{ color: 'var(--accent-coral)' }} />
                        <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>Collateral Ratio</h4>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-coral)' }}>{collateralRatio}%</div>
                </div>
            </div>

            {/* Loan Application and Active Loans - Full width sections below */}
            <div style={{ gridColumn: '1 / -1', display: 'grid', gap: 'var(--spacing-xl)', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
                <LoanApplicationForm
                    creditScore={score}
                    creditProfileRecord={creditProfileRecord}
                />
                <ActiveLoans />
            </div>
        </div>
    );
};

export default Dashboard;
