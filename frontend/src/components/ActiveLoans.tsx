import { FC, useState, useEffect } from 'react';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { FileText, DollarSign, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';
import { LOAN_STATUS } from '../utils/constants';
import { getActiveLoans, makePayment, decryptLoanRecord, clearRecordsCache } from '../utils/aleo';

interface Loan {
    id: string;
    principal: number;
    collateral: number;
    remainingBalance: number;
    nextPaymentDue: number;
    status: number;
    paymentsMade: number;
    termBlocks: number;
    interestRate: number;
    record?: any; // Store the encrypted record for transactions
}

const ActiveLoans: FC = () => {
    const wallet = useWallet();
    const { connected } = wallet;
    const [loans, setLoans] = useState<Loan[]>([]);
    const [selectedLoan, setSelectedLoan] = useState<string | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<number>(10);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [loading, setLoading] = useState(false);

    // Removed automatic fetching to prevent wallet popup spam
    // User must manually click "Load Loans" button

    const fetchLoans = async () => {
        if (!connected) {
            console.error('Wallet not connected');
            return;
        }

        setLoading(true);
        try {
            const loanRecords = await getActiveLoans(wallet);
            console.log('Fetched loan records:', loanRecords);
            // Parse loan records (structure depends on wallet adapter response)
            setLoans(loanRecords as any[]);
        } catch (error) {
            console.error('Error fetching loans:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMakePayment = async (loanId: string) => {
        setIsProcessingPayment(true);

        try {
            console.log('Making payment on blockchain:', { loanId, amount: paymentAmount });

            // Find the loan record
            const loan = loans.find(l => l.id === loanId);
            if (!loan) {
                console.error('Loan not found');
                return;
            }

            if (!loan.record) {
                console.error('Loan record not available - cannot make payment');
                return;
            }

            // Submit payment to blockchain using the encrypted record
            const result = await makePayment(wallet, loan.record, paymentAmount);
            console.log('Payment successful:', result);

            // Clear cache and refresh loans after successful payment
            clearRecordsCache();
            
            // Wait a moment for transaction to finalize, then refresh
            setTimeout(async () => {
                await fetchLoans();
                setSelectedLoan(null);
            }, 5000);
        } catch (error: any) {
            console.error('Error making payment:', error);
            alert(`Payment failed: ${error?.message || 'Unknown error'}`);
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const getStatusBadge = (status: number) => {
        switch (status) {
            case LOAN_STATUS.ACTIVE:
                return <span className="badge badge-success">Active</span>;
            case LOAN_STATUS.PAID_OFF:
                return <span className="badge badge-success">Paid Off</span>;
            case LOAN_STATUS.DEFAULTED:
                return <span className="badge badge-danger">Defaulted</span>;
            default:
                return <span className="badge">Unknown</span>;
        }
    };

    if (loans.length === 0) {
        return (
            <div className="card">
                <h3 style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <FileText size={24} />
                    Active Loans
                </h3>

                <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', opacity: 0.6 }}>
                    <FileText size={48} style={{ opacity: 0.3, marginBottom: 'var(--spacing-md)' }} />
                    <p>No active loans loaded</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 'var(--spacing-sm)' }}>
                        Click below to load your loans from the blockchain
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={fetchLoans}
                        disabled={!connected || loading}
                        style={{ marginTop: 'var(--spacing-md)' }}
                    >
                        {loading ? 'Loading...' : 'Load My Loans'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <h3 style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                <FileText size={24} />
                Active Loans ({loans.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                {loans.map((loan) => (
                    <div
                        key={loan.id}
                        style={{
                            padding: 'var(--spacing-md)',
                            background: 'var(--bg-hover)',
                            borderRadius: 'var(--radius-md)',
                            border: selectedLoan === loan.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                        onClick={() => setSelectedLoan(selectedLoan === loan.id ? null : loan.id)}
                    >
                        {/* Loan Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Loan ID</div>
                                <div style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{loan.id}</div>
                            </div>
                            {getStatusBadge(loan.status)}
                        </div>

                        {/* Loan Stats Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: 'var(--spacing-md)',
                            marginBottom: 'var(--spacing-md)'
                        }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>
                                    <DollarSign size={12} style={{ display: 'inline' }} /> Principal
                                </div>
                                <div style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>
                                    {loan.principal > 0 ? `${loan.principal.toFixed(2)} Credits` : 'Decrypt to view'}
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>
                                    <TrendingUp size={12} style={{ display: 'inline' }} /> Remaining
                                </div>
                                <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--warning)' }}>
                                    {loan.remainingBalance > 0 ? `${loan.remainingBalance.toFixed(2)} Credits` : 'Decrypt to view'}
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>
                                    Collateral
                                </div>
                                <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--secondary)' }}>
                                    {loan.collateral > 0 ? `${loan.collateral.toFixed(2)} Credits` : 'Decrypt to view'}
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>
                                    <Calendar size={12} style={{ display: 'inline' }} /> Payments Made
                                </div>
                                <div style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>
                                    {loan.paymentsMade !== undefined ? `${loan.paymentsMade}` : '-'}
                                </div>
                            </div>
                        </div>

                        {/* Payment Form (when selected) */}
                        {selectedLoan === loan.id && loan.status === LOAN_STATUS.ACTIVE && (
                            <div style={{
                                marginTop: 'var(--spacing-md)',
                                paddingTop: 'var(--spacing-md)',
                                borderTop: '1px solid var(--border)',
                            }}>
                                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    Payment Amount
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max={loan.remainingBalance}
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                                    style={{
                                        width: '100%',
                                        padding: 'var(--spacing-sm)',
                                        background: 'var(--bg-dark)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius-md)',
                                        marginBottom: 'var(--spacing-md)',
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />

                                <button
                                    className="btn btn-primary"
                                    style={{ width: '100%' }}
                                    disabled={isProcessingPayment}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleMakePayment(loan.id);
                                    }}
                                >
                                    {isProcessingPayment ? 'Processing Payment...' : `Pay ${paymentAmount} Credits`}
                                </button>

                                {/* Warning for overdue - only show if we have valid payment due date */}
                                {loan.nextPaymentDue > 0 && loan.nextPaymentDue < Math.floor(Date.now() / 1000) && (
                                    <div style={{
                                        marginTop: 'var(--spacing-sm)',
                                        padding: 'var(--spacing-sm)',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid var(--danger)',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.75rem',
                                    }}>
                                        <AlertTriangle size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                        Payment overdue - this may affect your credit score
                                    </div>
                                )}
                                
                                {/* Warning if loan data not decrypted */}
                                {loan.principal === 0 && loan.remainingBalance === 0 && (
                                    <div style={{
                                        marginTop: 'var(--spacing-sm)',
                                        padding: 'var(--spacing-sm)',
                                        background: 'rgba(245, 158, 11, 0.1)',
                                        border: '1px solid var(--warning)',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.75rem',
                                    }}>
                                        <AlertTriangle size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                        Loan data not decrypted. Approve decryption in wallet to view details.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActiveLoans;
