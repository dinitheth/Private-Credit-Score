import { FC, useState, useEffect } from 'react';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { CreditCard, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface Payment {
    loanId: string;
    amount: number;
    status: 'on_time' | 'late' | 'default';
    timestamp: number;
    blockHeight: number;
}

const PaymentHistory: FC = () => {
    const wallet = useWallet();
    const { connected } = wallet;
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (connected) {
            fetchPaymentHistory();
        } else {
            setPayments([]);
        }
    }, [connected]);

    const fetchPaymentHistory = async () => {
        setLoading(true);
        try {
            // In a real implementation, you would fetch payment history from blockchain records
            // This would require querying loan records and payment tracker records
            // TODO: Implement payment history fetching from blockchain records
            console.log('Fetching payment history...');
            
            // Placeholder - in production, fetch from loan records and payment tracker
            setPayments([]);
        } catch (error) {
            console.error('Error fetching payment history:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPaymentStatusIcon = (status: string) => {
        switch (status) {
            case 'on_time':
                return <CheckCircle size={20} style={{ color: 'var(--accent-green)' }} />;
            case 'late':
                return <AlertCircle size={20} style={{ color: 'var(--warning)' }} />;
            case 'default':
                return <XCircle size={20} style={{ color: 'var(--danger)' }} />;
            default:
                return <CreditCard size={20} />;
        }
    };

    const getPaymentStatusBadge = (status: string) => {
        switch (status) {
            case 'on_time':
                return <span className="badge badge-success">On Time</span>;
            case 'late':
                return <span className="badge badge-warning">Late</span>;
            case 'default':
                return <span className="badge badge-danger">Default</span>;
            default:
                return <span className="badge">Unknown</span>;
        }
    };

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleString();
    };

    if (!connected) {
        return (
            <div className="card">
                <h3 style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <CreditCard size={24} />
                    Payment History
                </h3>
                <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', opacity: 0.6 }}>
                    <CreditCard size={48} style={{ opacity: 0.3, marginBottom: 'var(--spacing-md)' }} />
                    <p>Connect your wallet to view payment history</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <CreditCard size={24} />
                    Payment History
                </h3>
                <button
                    className="btn btn-secondary"
                    onClick={fetchPaymentHistory}
                    disabled={loading}
                >
                    {loading ? 'Loading...' : 'Refresh'}
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                    <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--text-muted)' }}>
                        Loading payment history...
                    </p>
                </div>
            ) : payments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', opacity: 0.6 }}>
                    <CreditCard size={48} style={{ opacity: 0.3, marginBottom: 'var(--spacing-md)' }} />
                    <p>No payment history found</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 'var(--spacing-sm)' }}>
                        Payment history is tracked on-chain. Make payments to build your history.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    {payments.map((payment, index) => (
                        <div
                            key={index}
                            style={{
                                padding: 'var(--spacing-md)',
                                background: 'var(--bg-hover)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border)',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-sm)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                    {getPaymentStatusIcon(payment.status)}
                                    <div>
                                        <div style={{ fontWeight: 'bold', marginBottom: 'var(--spacing-xs)' }}>
                                            {payment.amount.toFixed(2)} Credits
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                            Loan: {payment.loanId.slice(0, 16)}...
                                        </div>
                                    </div>
                                </div>
                                {getPaymentStatusBadge(payment.status)}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'var(--spacing-sm)' }}>
                                {formatTimestamp(payment.timestamp)} • Block {payment.blockHeight}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PaymentHistory;
