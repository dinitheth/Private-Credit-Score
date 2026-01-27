import { FC, useState } from 'react';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { DollarSign, Calendar, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import { LOAN_TERMS, CREDIT_SCORE_DEFAULT } from '../utils/constants';
import { applyForLoan } from '../utils/aleo';

interface LoanApplicationFormProps {
    creditScore?: number;
    creditProfileRecord?: any;
}

const LoanApplicationForm: FC<LoanApplicationFormProps> = ({
    creditScore = CREDIT_SCORE_DEFAULT,
    creditProfileRecord,
}) => {
    const wallet = useWallet();
    const [principal, setPrincipal] = useState(100);
    const [termIndex, setTermIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Calculate collateral requirement based on credit score
    const getCollateralRatio = (score: number): number => {
        if (score >= 800) return 50;
        if (score >= 700) return 75;
        if (score >= 650) return 100;
        if (score >= 600) return 125;
        return 150;
    };

    const collateralRatio = getCollateralRatio(creditScore);
    const requiredCollateral = Math.round((principal * collateralRatio) / 100);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!wallet.connected || !wallet.publicKey) {
            console.error('Wallet not connected');
            return;
        }

        setIsSubmitting(true);

        try {
            console.log('Applying for loan on blockchain:', {
                principal,
                term: LOAN_TERMS[termIndex],
                collateral: requiredCollateral
            });

            // Use credit profile record from Dashboard
            if (!creditProfileRecord) {
                console.error('No credit profile available - please create one first');
                return;
            }

            console.log('Using credit profile record:', creditProfileRecord);

            const result = await applyForLoan(
                wallet,
                creditProfileRecord,
                principal,
                requiredCollateral,
                LOAN_TERMS[termIndex].blocks
            );

            console.log('Loan application submitted successfully:', result);

            // Show success message
            setSuccessMessage(`Loan for ${principal} credits submitted successfully!`);

            // Clear success message after 5 seconds
            setTimeout(() => setSuccessMessage(null), 5000);

            // Reset form on success
            setPrincipal(100);
            setTermIndex(0);
        } catch (error: any) {
            console.error('Error applying for loan:', error);
            setSuccessMessage(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="card">
            <h3 style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                <DollarSign size={24} />
                Apply for Loan
            </h3>

            {/* Success Message */}
            {successMessage && (
                <div style={{
                    padding: 'var(--spacing-md)',
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '2px solid var(--accent-green)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--spacing-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)',
                    animation: 'fade-in 0.3s ease'
                }}>
                    <CheckCircle size={20} style={{ color: 'var(--accent-green)' }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--accent-green)', marginBottom: 'var(--spacing-xs)' }}>
                            Success!
                        </div>
                        <div style={{ fontSize: '0.875rem' }}>
                            {successMessage}
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Loan Amount */}
                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Loan Amount (Aleo Credits)
                    </label>
                    <input
                        type="range"
                        min="10"
                        max="1000"
                        value={principal}
                        onChange={(e) => setPrincipal(Number(e.target.value))}
                        style={{
                            width: '100%',
                            marginBottom: 'var(--spacing-sm)',
                        }}
                    />
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                        {principal} Credits
                    </div>
                </div>

                {/* Loan Term */}
                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        <Calendar size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
                        Loan Term
                    </label>
                    <select
                        value={termIndex}
                        onChange={(e) => setTermIndex(Number(e.target.value))}
                        style={{
                            width: '100%',
                            padding: 'var(--spacing-sm) var(--spacing-md)',
                            background: 'var(--bg-hover)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '1rem',
                        }}
                    >
                        {LOAN_TERMS.map((term, idx) => (
                            <option key={idx} value={idx}>
                                {term.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Collateral Display */}
                <div style={{
                    padding: 'var(--spacing-md)',
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--spacing-lg)',
                }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>
                        <TrendingDown size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                        Required Collateral ({collateralRatio}%)
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--secondary)' }}>
                        {requiredCollateral} Credits
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                        Higher credit scores unlock better rates
                    </div>
                </div>

                {/* Eligibility Check */}
                {creditScore < 600 && (
                    <div style={{
                        padding: 'var(--spacing-md)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid var(--danger)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--spacing-lg)',
                        fontSize: '0.875rem',
                    }}>
                        <AlertCircle size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                        Credit score must be at least 600 to apply for loans
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting || creditScore < 600}
                    style={{ width: '100%' }}
                >
                    {isSubmitting ? 'Processing...' : 'Apply for Loan'}
                </button>

                <div style={{
                    marginTop: 'var(--spacing-md)',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                }}>
                    Application will be processed privately via zero-knowledge proofs
                </div>
            </form>
        </div>
    );
};

export default LoanApplicationForm;
