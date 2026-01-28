import { FC, useState } from 'react';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { TrendingUp, Eye, EyeOff, Shield, CheckCircle } from 'lucide-react';
import { CREDIT_TIERS } from '../utils/constants';
import { requestDecryption } from '../utils/aleo';

interface CreditScoreCardProps {
    score?: number;
    paymentCount?: number;
    onTimePayments?: number;
    latePayments?: number;
    defaults?: number;
}

const CreditScoreCard: FC<CreditScoreCardProps> = ({
    score,
    paymentCount,
    onTimePayments,
    latePayments,
    defaults,
}) => {
    const wallet = useWallet();
    const [showScore, setShowScore] = useState(true);
    const [isDecrypting, setIsDecrypting] = useState(false);

    // Find credit tier - only if we have a real score
    const tier = (score !== undefined && score !== null) 
        ? (CREDIT_TIERS.find(t => score >= t.min && score <= t.max) || CREDIT_TIERS[CREDIT_TIERS.length - 1])
        : null;

    // Calculate on-time percentage - only if we have real data
    const onTimePercentage = (paymentCount !== undefined && paymentCount !== null && paymentCount > 0 && onTimePayments !== undefined)
        ? Math.round((onTimePayments / paymentCount) * 100)
        : null;

    return (
        <div className="card" style={{ background: `linear-gradient(135deg, var(--bg-card), ${tier.color}15)` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-lg)' }}>
                <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
                        <TrendingUp size={24} />
                        Credit Score
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        Privacy-preserved • Zero-knowledge
                    </p>
                </div>

                <button
                    className="btn btn-secondary"
                    onClick={() => setShowScore(!showScore)}
                    style={{ padding: 'var(--spacing-xs)' }}
                >
                    {showScore ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
            </div>

            {/* Score Display */}
            <div style={{ textAlign: 'center', margin: 'var(--spacing-xl) 0' }}>
                {score === undefined || score === null ? (
                    <div style={{ padding: 'var(--spacing-xl)', color: 'var(--text-muted)' }}>
                        <Shield size={48} style={{ opacity: 0.3 }} />
                        <p style={{ marginTop: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>Decrypt record to view score</p>
                        <button
                            className="btn btn-primary"
                            onClick={async () => {
                                setIsDecrypting(true);
                                try {
                                    const success = await requestDecryption(wallet);
                                    if (success) {
                                        // Refresh page to reload decrypted data
                                        window.location.reload();
                                    }
                                } finally {
                                    setIsDecrypting(false);
                                }
                            }}
                            disabled={isDecrypting || !wallet.connected}
                            style={{ marginTop: 'var(--spacing-md)', width: '100%' }}
                        >
                            {isDecrypting ? 'Requesting Permission...' : 'Decrypt My Credit Score'}
                        </button>
                        <div style={{ 
                            padding: 'var(--spacing-md)', 
                            background: 'rgba(99, 102, 241, 0.1)', 
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.875rem',
                            textAlign: 'left',
                            marginTop: 'var(--spacing-md)'
                        }}>
                            <strong>What does "Decrypt record to view" mean?</strong>
                            <p style={{ marginTop: 'var(--spacing-xs)', fontSize: '0.75rem', opacity: 0.9 }}>
                                Your credit data is <strong>encrypted on the blockchain</strong> for privacy. Only you can decrypt it with your wallet.
                            </p>
                            <p style={{ marginTop: 'var(--spacing-xs)', fontSize: '0.75rem', opacity: 0.9 }}>
                                <strong>How to decrypt:</strong> Click the button above. Your <strong>Leo Wallet</strong> will show a popup asking for permission. Click <strong>"Approve"</strong> in the wallet popup to decrypt and view your score.
                            </p>
                        </div>
                    </div>
                ) : showScore ? (
                    <>
                        {tier && (
                            <>
                                <div style={{
                                    fontSize: '4rem',
                                    fontWeight: 'bold',
                                    background: `linear-gradient(135deg, ${tier.color}, white)`,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    marginBottom: 'var(--spacing-sm)'
                                }}>
                                    {score}
                                </div>
                                <div className="badge" style={{
                                    background: `${tier.color}20`,
                                    color: tier.color,
                                    border: `1px solid ${tier.color}`,
                                    fontSize: '1rem'
                                }}>
                                    {tier.label}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <div style={{ padding: 'var(--spacing-xl)', color: 'var(--text-muted)' }}>
                        <Shield size={48} style={{ opacity: 0.3 }} />
                        <p style={{ marginTop: 'var(--spacing-sm)' }}>Score Hidden</p>
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: 'var(--spacing-md)',
                marginTop: 'var(--spacing-xl)',
                paddingTop: 'var(--spacing-lg)',
                borderTop: '1px solid var(--border)'
            }}>
                <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>
                        Total Payments
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {paymentCount !== undefined && paymentCount !== null ? paymentCount : '-'}
                    </div>
                </div>

                <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>
                        On-Time Rate
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                        {onTimePercentage !== null ? (
                            <>
                                {onTimePercentage}%
                                {onTimePercentage > 90 && <CheckCircle size={20} />}
                            </>
                        ) : '-'}
                    </div>
                </div>

                <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>
                        Collateral Ratio
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: tier?.color || 'var(--text-muted)' }}>
                        {tier ? `${tier.collateral}%` : '-'}
                    </div>
                </div>

                <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>
                        Defaults
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: (defaults !== undefined && defaults !== null && defaults > 0) ? 'var(--danger)' : 'var(--text-secondary)' }}>
                        {defaults !== undefined && defaults !== null ? defaults : '-'}
                    </div>
                </div>
            </div>

            {/* Info Banner */}
            <div style={{
                marginTop: 'var(--spacing-lg)',
                padding: 'var(--spacing-md)',
                background: 'rgba(99, 102, 241, 0.1)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)'
            }}>
                <strong>Privacy Guarantee:</strong> Your exact credit score is encrypted and stored privately.
                You can prove score thresholds without revealing the actual value.
            </div>
        </div>
    );
};

export default CreditScoreCard;
