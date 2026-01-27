import { FC, useState } from 'react';
import { TrendingUp, Eye, EyeOff, Shield, CheckCircle } from 'lucide-react';
import { CREDIT_TIERS, CREDIT_SCORE_DEFAULT } from '../utils/constants';

interface CreditScoreCardProps {
    score?: number;
    paymentCount?: number;
    onTimePayments?: number;
    latePayments?: number;
    defaults?: number;
}

const CreditScoreCard: FC<CreditScoreCardProps> = ({
    score = CREDIT_SCORE_DEFAULT,
    paymentCount = 0,
    onTimePayments = 0,
    latePayments = 0,
    defaults = 0,
}) => {
    const [showScore, setShowScore] = useState(true);

    // Find credit tier
    const tier = CREDIT_TIERS.find(t => score >= t.min && score <= t.max) || CREDIT_TIERS[CREDIT_TIERS.length - 1];

    // Calculate on-time percentage
    const onTimePercentage = paymentCount > 0 ? Math.round((onTimePayments / paymentCount) * 100) : 0;

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
                {showScore ? (
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
                        {paymentCount}
                    </div>
                </div>

                <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>
                        On-Time Rate
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                        {onTimePercentage}%
                        {onTimePercentage > 90 && <CheckCircle size={20} />}
                    </div>
                </div>

                <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>
                        Collateral Ratio
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: tier.color }}>
                        {tier.collateral}%
                    </div>
                </div>

                <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>
                        Defaults
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: defaults > 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>
                        {defaults}
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
