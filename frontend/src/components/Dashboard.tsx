import { FC, useState, useEffect, useRef } from 'react';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { TrendingUp, Wallet, AlertCircle } from 'lucide-react';
import CreditScoreCard from './CreditScoreCard';
import LoanApplicationForm from './LoanApplicationForm';
import ActiveLoans from './ActiveLoans';
import TransactionHistory from './TransactionHistory';
import PaymentHistory from './PaymentHistory';
import Settings from './Settings';
import { initializeCreditProfile, getCreditProfileRecord, clearRecordsCache, decryptCreditProfileRecord, requestDecryption } from '../utils/aleo';
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
    const [isCheckingProfile, setIsCheckingProfile] = useState(false);
    const [isDecrypting, setIsDecrypting] = useState(false);
    const hasCheckedRef = useRef(false); // Prevent multiple checks

    useEffect(() => {
        // Only check once when wallet connects, or if publicKey changes
        if (connected && publicKey && !isCheckingProfile && !hasCheckedRef.current) {
            hasCheckedRef.current = true;
            // Check if user has initialized credit profile
            checkCreditProfileStatus();
        } else if (!connected) {
            // Reset when disconnected
            hasCheckedRef.current = false;
            setLoading(false);
        }
    }, [connected, publicKey]);

    const checkCreditProfileStatus = async () => {
        // Prevent multiple simultaneous calls
        if (isCheckingProfile) {
            console.log('Profile check already in progress, skipping...');
            return;
        }

        setIsCheckingProfile(true);
        setLoading(true);
        
        try {
            // Force refresh to get latest records after transactions
            // This ensures we get the new unspent record created by the transaction
            const profileRecord = await getCreditProfileRecord(wallet, true);
            
            if (profileRecord) {
                // Always set the record, even if spent (so form knows profile exists)
                // The form will handle spent record errors appropriately
                console.log('Credit Profile Record:', {
                    id: profileRecord.id,
                    spent: profileRecord.spent,
                    owner: profileRecord.owner
                });
                
                setCreditProfileRecord(profileRecord); // Store raw encrypted record
                
                // Try to decrypt the record to get actual data
                try {
                    const decryptedData = await decryptCreditProfileRecord(wallet, profileRecord);
                    if (decryptedData) {
                        console.log('Decrypted credit profile data:', decryptedData);
                        setCreditProfileData(decryptedData);
                    } else {
                        // If decryption fails (user denied permission), that's okay
                        // Components will show "Decrypt to view" message
                        console.log('Credit profile record found but not decrypted - user can approve decryption when needed');
                        setCreditProfileData(null);
                    }
                } catch (decryptError: any) {
                    // Permission denied errors are expected and handled gracefully
                    const isPermissionError = decryptError?.name === 'WalletRecordsError' || 
                                             /permission.*not.*granted/i.test(decryptError?.message || '');
                    if (!isPermissionError) {
                        console.warn('Decryption error:', decryptError);
                    }
                    setCreditProfileData(null);
                }
                
                // Function to manually request decryption
                const handleRequestDecryption = async () => {
                    setIsDecrypting(true);
                    try {
                        const success = await requestDecryption(wallet);
                        if (success) {
                            // Refresh profile after successful decryption
                            setTimeout(() => {
                                checkCreditProfileStatus();
                            }, 1000);
                        } else {
                            console.log('Decryption permission denied or failed');
                        }
                    } catch (error) {
                        console.error('Error requesting decryption:', error);
                    } finally {
                        setIsDecrypting(false);
                    }
                };
                
                // Store handler for use in components
                (window as any).requestDecryption = handleRequestDecryption;
                
                setHasCreditProfile(true);
                
                if (profileRecord.spent === true) {
                    console.warn('Note: Record is marked as spent. A new unspent record may be available after transaction finalizes.');
                }
            } else {
                setHasCreditProfile(false);
                setCreditProfileRecord(null);
                setCreditProfileData(null);
            }
        } catch (error) {
            console.error('Error checking credit profile:', error);
            setHasCreditProfile(false);
            setCreditProfileRecord(null);
            setCreditProfileData(null);
        } finally {
            setLoading(false);
            setIsCheckingProfile(false);
        }
    };

    const handleInitializeCreditProfile = async () => {
        setInitializing(true);
        try {
            console.log('Initializing credit profile on Aleo testnet beta...');
            const result = await initializeCreditProfile(wallet);
            console.log('Credit profile initialized successfully:', result);
            
            // Clear cache so we fetch fresh records
            clearRecordsCache();
            
            // Wait a moment for the transaction to be processed, then refresh
            setTimeout(() => {
                checkCreditProfileStatus();
                setInitializing(false);
            }, 3000);
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
                <p>Use the <strong>Connect Wallet</strong> button above and choose Leo Wallet.</p>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 'var(--spacing-md)' }}>
                    <AlertCircle size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Your credit score and financial data remain completely private
                </div>
                <ul style={{
                    marginTop: 'var(--spacing-lg)',
                    paddingLeft: '1.25rem',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    maxWidth: '360px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                }}>
                    <li>Install <a href="https://leo.app" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-light)' }}>Leo Wallet</a> if needed</li>
                    <li>In Leo Wallet, switch network to <strong>Testnet</strong></li>
                    <li>Refresh this page after installing the extension</li>
                </ul>
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

    // Show create profile screen if no profile exists OR if profile exists but no valid record
    if (!hasCreditProfile || !creditProfileRecord) {
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

    if (currentView === 'transactions') {
        return (
            <div className="dashboard-grid fade-in">
                <div style={{ gridColumn: '1 / -1' }}>
                    <TransactionHistory />
                </div>
            </div>
        );
    }

    if (currentView === 'payments') {
        return (
            <div className="dashboard-grid fade-in">
                <div style={{ gridColumn: '1 / -1' }}>
                    <PaymentHistory />
                </div>
            </div>
        );
    }

    if (currentView === 'settings') {
        return (
            <div className="dashboard-grid fade-in">
                <div style={{ gridColumn: '1 / -1' }}>
                    <Settings />
                </div>
            </div>
        );
    }

    if (currentView === 'apply') {
        // If no credit profile, show create profile screen
        if (!hasCreditProfile || !creditProfileRecord) {
            return (
                <div className="empty-state card fade-in">
                    <div className="empty-state-icon">
                        <TrendingUp size={64} />
                    </div>
                    <h3>Create Credit Profile First</h3>
                    <p>You need a credit profile before applying for loans</p>
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
        
        const applyScore = creditProfileData?.score ?? null;
        return (
            <div className="dashboard-grid fade-in">
                <div style={{ gridColumn: '1 / -1' }}>
                    <CreditScoreCard
                        score={applyScore ?? undefined}
                        paymentCount={creditProfileData?.payment_count}
                        onTimePayments={creditProfileData?.on_time_payments}
                        latePayments={creditProfileData?.late_payments}
                        defaults={creditProfileData?.defaults}
                    />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                    <LoanApplicationForm
                        creditScore={applyScore ?? undefined}
                        creditProfileRecord={creditProfileRecord}
                        onTransactionSuccess={checkCreditProfileStatus}
                    />
                </div>
            </div>
        );
    }

    // Calculate derived values - only use real data, no defaults
    const score = creditProfileData?.score ?? null;
    const totalPayments = creditProfileData?.payment_count ?? null;
    const onTimeRate = (totalPayments !== null && totalPayments > 0 && creditProfileData)
        ? Math.round((creditProfileData.on_time_payments / totalPayments) * 100)
        : null;

    // Calculate collateral ratio based on score - only if we have real data
    let collateralRatio: number | null = null;
    if (score !== null) {
        if (score >= 800) collateralRatio = 50;
        else if (score >= 700) collateralRatio = 75;
        else if (score >= 650) collateralRatio = 100;
        else if (score >= 600) collateralRatio = 125;
        else collateralRatio = 150;
    }

    // Determine score tier - only if we have real data
    let scoreTier: string | null = null;
    let scoreColor = 'var(--text-muted)';
    if (score !== null) {
        if (score >= 750) {
            scoreTier = 'Excellent';
            scoreColor = 'var(--accent-green)';
        } else if (score >= 650) {
            scoreTier = 'Good';
            scoreColor = 'var(--accent-green)';
        } else if (score >= 500) {
            scoreTier = 'Fair';
            scoreColor = 'var(--accent-coral)';
        } else {
            scoreTier = 'Poor';
            scoreColor = 'var(--accent-coral)';
        }
    }

    // Default: Dashboard view - Compact overview with key metrics
    return (
        <div className="dashboard-grid fade-in">
            {/* Decryption Info Banner - Show when data not decrypted */}
            {hasCreditProfile && creditProfileRecord && score === null && (
                <div style={{
                    gridColumn: '1 / -1',
                    padding: 'var(--spacing-md)',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid var(--warning)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--spacing-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 'var(--spacing-md)'
                }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', marginBottom: 'var(--spacing-xs)' }}>
                            Decrypt Your Credit Data
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Your credit data is encrypted for privacy. Click below to approve decryption in your wallet and view your score.
                        </div>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={async () => {
                            setIsDecrypting(true);
                            try {
                                const success = await requestDecryption(wallet);
                                if (success) {
                                    setTimeout(() => checkCreditProfileStatus(), 1000);
                                }
                            } finally {
                                setIsDecrypting(false);
                            }
                        }}
                        disabled={isDecrypting}
                    >
                        {isDecrypting ? 'Requesting...' : 'Decrypt Now'}
                    </button>
                </div>
            )}
            
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
                    {score !== null ? (
                        <>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: scoreColor }}>{score}</div>
                            {scoreTier && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'var(--spacing-xs)' }}>{scoreTier}</div>}
                        </>
                    ) : (
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            <div style={{ marginBottom: 'var(--spacing-sm)' }}>Decrypt record to view</div>
                            <button
                                className="btn btn-secondary"
                                onClick={async () => {
                                    setIsDecrypting(true);
                                    try {
                                        const success = await requestDecryption(wallet);
                                        if (success) {
                                            setTimeout(() => checkCreditProfileStatus(), 1000);
                                        }
                                    } finally {
                                        setIsDecrypting(false);
                                    }
                                }}
                                disabled={isDecrypting}
                                style={{ fontSize: '0.75rem', padding: 'var(--spacing-xs) var(--spacing-sm)' }}
                            >
                                {isDecrypting ? 'Requesting...' : 'Decrypt Now'}
                            </button>
                            <div style={{ fontSize: '0.7rem', marginTop: 'var(--spacing-xs)', opacity: 0.7 }}>
                                Click to approve decryption in wallet
                            </div>
                        </div>
                    )}
                </div>

                {/* Total Payments */}
                <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                        <TrendingUp size={20} style={{ color: 'var(--accent-green)' }} />
                        <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>Total Payments</h4>
                    </div>
                    {totalPayments !== null ? (
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{totalPayments}</div>
                    ) : (
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Decrypt record to view</div>
                    )}
                </div>

                {/* On-Time Rate */}
                <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                        <TrendingUp size={20} style={{ color: 'var(--accent-green)' }} />
                        <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>On-Time Rate</h4>
                    </div>
                    {onTimeRate !== null ? (
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>{onTimeRate}%</div>
                    ) : (
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Decrypt record to view</div>
                    )}
                </div>

                {/* Collateral Ratio */}
                <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                        <AlertCircle size={20} style={{ color: 'var(--accent-coral)' }} />
                        <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>Collateral Ratio</h4>
                    </div>
                    {collateralRatio !== null ? (
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-coral)' }}>{collateralRatio}%</div>
                    ) : (
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Decrypt record to view</div>
                    )}
                </div>
            </div>

            {/* Loan Application and Active Loans - Full width sections below */}
            <div style={{ gridColumn: '1 / -1', display: 'grid', gap: 'var(--spacing-xl)', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
                <LoanApplicationForm
                    creditScore={score ?? undefined}
                    creditProfileRecord={creditProfileRecord}
                    onTransactionSuccess={checkCreditProfileStatus}
                />
                <ActiveLoans />
            </div>
        </div>
    );
};

export default Dashboard;
