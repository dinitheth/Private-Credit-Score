import { FC, useState, useEffect } from 'react';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { History, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react';
import { EXPLORER_URL } from '../utils/constants';

interface Transaction {
    id: string;
    type: 'credit_profile' | 'loan_application' | 'payment' | 'other';
    status: 'pending' | 'confirmed' | 'failed';
    timestamp: number;
    description: string;
}

const TransactionHistory: FC = () => {
    const wallet = useWallet();
    const { connected, publicKey } = wallet;
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (connected && publicKey) {
            fetchTransactionHistory();
        } else {
            setTransactions([]);
        }
    }, [connected, publicKey]);

    const fetchTransactionHistory = async () => {
        if (!publicKey) return;

        setLoading(true);
        try {
            // In a real implementation, you would fetch transactions from Aleo Explorer API
            // For now, we'll show a message that this requires API integration
            // TODO: Integrate with Aleo Explorer API to fetch real transaction history
            console.log('Fetching transaction history for:', publicKey);
            
            // Placeholder - in production, fetch from Aleo Explorer API
            // Example API endpoint: https://api.explorer.provable.com/v1/transactions?address={publicKey}
            setTransactions([]);
        } catch (error) {
            console.error('Error fetching transaction history:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'credit_profile':
                return <CheckCircle size={20} />;
            case 'loan_application':
                return <ExternalLink size={20} />;
            case 'payment':
                return <CheckCircle size={20} />;
            default:
                return <History size={20} />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'confirmed':
                return <span className="badge badge-success">Confirmed</span>;
            case 'pending':
                return <span className="badge badge-warning">Pending</span>;
            case 'failed':
                return <span className="badge badge-danger">Failed</span>;
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
                    <History size={24} />
                    Transaction History
                </h3>
                <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', opacity: 0.6 }}>
                    <History size={48} style={{ opacity: 0.3, marginBottom: 'var(--spacing-md)' }} />
                    <p>Connect your wallet to view transaction history</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <History size={24} />
                    Transaction History
                </h3>
                <button
                    className="btn btn-secondary"
                    onClick={fetchTransactionHistory}
                    disabled={loading}
                >
                    {loading ? 'Loading...' : 'Refresh'}
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                    <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--text-muted)' }}>
                        Loading transactions...
                    </p>
                </div>
            ) : transactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', opacity: 0.6 }}>
                    <History size={48} style={{ opacity: 0.3, marginBottom: 'var(--spacing-md)' }} />
                    <p>No transactions found</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 'var(--spacing-sm)' }}>
                        Transaction history requires integration with Aleo Explorer API
                    </p>
                    <a
                        href={`${EXPLORER_URL}/address/${publicKey}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary"
                        style={{ marginTop: 'var(--spacing-md)' }}
                    >
                        <ExternalLink size={16} style={{ marginRight: 'var(--spacing-xs)' }} />
                        View on Explorer
                    </a>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    {transactions.map((tx) => (
                        <div
                            key={tx.id}
                            style={{
                                padding: 'var(--spacing-md)',
                                background: 'var(--bg-hover)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border)',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-sm)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                    {getTransactionIcon(tx.type)}
                                    <div>
                                        <div style={{ fontWeight: 'bold', marginBottom: 'var(--spacing-xs)' }}>
                                            {tx.description}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                            {tx.id.slice(0, 16)}...
                                        </div>
                                    </div>
                                </div>
                                {getStatusBadge(tx.status)}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--spacing-sm)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    {formatTimestamp(tx.timestamp)}
                                </div>
                                <a
                                    href={`${EXPLORER_URL}/transaction/${tx.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ fontSize: '0.75rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}
                                >
                                    View <ExternalLink size={14} />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TransactionHistory;
