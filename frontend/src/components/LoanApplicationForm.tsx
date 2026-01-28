import { FC, useState, useRef } from 'react';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { DollarSign, Calendar, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import { LOAN_TERMS } from '../utils/constants';
import { applyForLoan, clearRecordsCache } from '../utils/aleo';

interface LoanApplicationFormProps {
    creditScore?: number;
    creditProfileRecord?: any;
    onTransactionSuccess?: () => void; // Callback to refresh records after successful transaction
}

const LoanApplicationForm: FC<LoanApplicationFormProps> = ({
    creditScore,
    creditProfileRecord,
    onTransactionSuccess,
}) => {
    const wallet = useWallet();
    const [principal, setPrincipal] = useState(100);
    const [termIndex, setTermIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const isSubmittingRef = useRef(false); // Ref to prevent multiple submissions

    // Calculate collateral requirement based on credit score
    // If score not available, use maximum (150%) - blockchain will verify actual requirement
    const getCollateralRatio = (score: number | undefined): number => {
        if (score === undefined || score === null) {
            // Default to maximum collateral if score not decrypted
            // Blockchain will verify actual requirement on-chain
            return 150;
        }
        if (score >= 800) return 50;
        if (score >= 700) return 75;
        if (score >= 650) return 100;
        if (score >= 600) return 125;
        return 150;
    };

    const collateralRatio = getCollateralRatio(creditScore);
    const requiredCollateral = Math.round((principal * collateralRatio) / 100);
    const isEstimatedCollateral = creditScore === undefined || creditScore === null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent event bubbling

        // Prevent multiple simultaneous submissions using ref (more reliable than state)
        if (isSubmittingRef.current || isSubmitting) {
            console.warn('Submission already in progress, ignoring duplicate request');
            return;
        }

        if (!wallet.connected || !wallet.publicKey) {
            console.error('Wallet not connected');
            return;
        }

        // Use credit profile record from Dashboard (required for apply_for_loan transition)
        if (!creditProfileRecord) {
            console.error('No credit profile available - please create one first');
            setErrorMessage('No credit profile available. Please create one from the Dashboard first.');
            return;
        }

        // Mark as submitting immediately
        isSubmittingRef.current = true;
        setIsSubmitting(true);
        
        // Clear any previous errors
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            console.log('Applying for loan on blockchain:', {
                principal,
                term: LOAN_TERMS[termIndex],
                collateral: requiredCollateral
            });

            console.log('Using credit profile record:', creditProfileRecord);

            const result = await applyForLoan(
                wallet,
                creditProfileRecord,
                principal,
                requiredCollateral,
                LOAN_TERMS[termIndex].blocks
            );

            console.log('Loan application submitted successfully:', result);

            // Clear records cache so fresh records are fetched next time
            clearRecordsCache();

            // Notify parent component to refresh credit profile records
            // This will fetch the new unspent record created by the transaction
            if (onTransactionSuccess) {
                // Wait a bit for transaction to be processed and new record to be available
                // Aleo transactions can take a few seconds to finalize
                setTimeout(() => {
                    console.log('Refreshing credit profile after successful loan application...');
                    onTransactionSuccess();
                }, 5000); // Increased wait time for transaction to finalize
            }

            // Show success message
            setSuccessMessage(`Loan for ${principal} credits submitted successfully! Transaction is processing...`);

            // Clear success message after 8 seconds
            setTimeout(() => setSuccessMessage(null), 8000);

            // Reset form on success
            setPrincipal(100);
            setTermIndex(0);
        } catch (error: any) {
            console.error('Error applying for loan:', error);
            setSuccessMessage(null);
            
            // Provide user-friendly error messages
            const errorMsg = error?.message || String(error);
            const errorStr = errorMsg.toLowerCase();
            
            if (errorStr.includes('unspent record not found') || errorStr.includes('record not found')) {
                setErrorMessage('Credit profile record not found or already spent. Please refresh the page or create a new credit profile.');
            } else if (errorStr.includes('not a valid record type') || errorStr.includes('invalid record')) {
                setErrorMessage('Invalid credit profile record format. Please refresh the page and try again. If the issue persists, create a new credit profile.');
            } else             if (errorStr.includes('already been spent') || errorStr.includes('spent')) {
                setErrorMessage('Your credit profile record has been used. Refreshing records in 3 seconds...');
                // Automatically refresh records if record is spent
                // Wait a bit longer to ensure transaction has finalized
                if (onTransactionSuccess) {
                    setTimeout(() => {
                        console.log('Auto-refreshing credit profile after spent record error...');
                        onTransactionSuccess();
                    }, 3000);
                }
            } else if (errorStr.includes('insufficient') || errorStr.includes('balance')) {
                setErrorMessage('Insufficient credits. Please ensure you have enough credits for the transaction fee (0.2 credits) and collateral.');
            } else if (errorStr.includes('permission') || errorStr.includes('denied')) {
                setErrorMessage('Wallet permission denied. Please approve the transaction in your Leo Wallet.');
            } else if (errorStr.includes('unknown error')) {
                setErrorMessage('Transaction failed. Please check: 1) Your credit profile exists, 2) You have sufficient credits, 3) Your wallet is connected and unlocked. Try refreshing the page.');
            } else {
                setErrorMessage(`Transaction failed: ${errorMsg}. Please try refreshing the page or contact support if the issue persists.`);
            }
            
            // Clear error after 8 seconds
            setTimeout(() => setErrorMessage(null), 8000);
        } finally {
            // Always reset submitting state
            setIsSubmitting(false);
            isSubmittingRef.current = false;
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

            {/* Error Message */}
            {errorMessage && (
                <div style={{
                    padding: 'var(--spacing-md)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '2px solid var(--danger)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--spacing-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)',
                    animation: 'fade-in 0.3s ease'
                }}>
                    <AlertCircle size={20} style={{ color: 'var(--danger)' }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--danger)', marginBottom: 'var(--spacing-xs)' }}>
                            Error
                        </div>
                        <div style={{ fontSize: '0.875rem' }}>
                            {errorMessage}
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
                    background: isEstimatedCollateral 
                        ? 'rgba(245, 158, 11, 0.1)' 
                        : 'rgba(139, 92, 246, 0.1)',
                    border: `1px solid ${isEstimatedCollateral ? 'var(--warning)' : 'rgba(139, 92, 246, 0.3)'}`,
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--spacing-lg)',
                }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>
                        <TrendingDown size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                        {isEstimatedCollateral ? 'Estimated' : 'Required'} Collateral ({collateralRatio}%)
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--secondary)' }}>
                        {requiredCollateral} Credits
                    </div>
                    {isEstimatedCollateral ? (
                        <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: 'var(--spacing-xs)' }}>
                            <AlertCircle size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                            Using maximum collateral (150%). Actual requirement will be calculated on-chain based on your credit score.
                        </div>
                    ) : (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                            Higher credit scores unlock better rates
                        </div>
                    )}
                </div>

                {/* No credit profile — create one on Dashboard first */}
                {!creditProfileRecord && (
                    <div style={{
                        padding: 'var(--spacing-md)',
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid var(--warning)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--spacing-lg)',
                        fontSize: '0.875rem',
                        textAlign: 'center',
                    }}>
                        <AlertCircle size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                        <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                            <strong>No credit profile found.</strong>
                        </div>
                        <div>
                            Go to the <strong>Dashboard</strong> tab (top navigation) and click <strong>"Create Credit Profile"</strong> to get started.
                        </div>
                    </div>
                )}

                {/* Credit profile exists but record is spent */}
                {creditProfileRecord && creditProfileRecord.spent === true && (
                    <div style={{
                        padding: 'var(--spacing-md)',
                        background: 'rgba(59, 130, 246, 0.15)',
                        border: '1px solid var(--primary)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--spacing-lg)',
                        fontSize: '0.875rem',
                    }}>
                        <AlertCircle size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                        Your credit profile record was used in a previous transaction. Waiting for new record to be available... (This may take a few seconds after your last transaction finalizes)
                    </div>
                )}

                {/* Eligibility Check */}
                {creditProfileRecord && creditScore !== undefined && creditScore !== null && creditScore < 600 && (
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
                    disabled={
                        isSubmitting || 
                        (creditScore !== undefined && creditScore !== null && creditScore < 600) || 
                        !creditProfileRecord || 
                        creditProfileRecord?.spent === true
                    }
                    style={{ width: '100%' }}
                >
                    {isSubmitting 
                        ? 'Processing...' 
                        : creditProfileRecord?.spent === true
                        ? 'Waiting for New Record...'
                        : 'Apply for Loan'}
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
