import { FC, useCallback, useMemo, useState } from 'react';
import { WalletProvider } from '@demox-labs/aleo-wallet-adapter-react';
import { WalletModalProvider } from '@demox-labs/aleo-wallet-adapter-reactui';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import {
    WalletAdapterNetwork,
    DecryptPermission,
    type WalletError,
} from '@demox-labs/aleo-wallet-adapter-base';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import {
    CREDIT_SCORE_PROGRAM,
    LOAN_MANAGER_PROGRAM,
    PAYMENT_TRACKER_PROGRAM,
} from './utils/constants';

// Import wallet adapter styles
import '@demox-labs/aleo-wallet-adapter-reactui/styles.css';
import './App.css';

export type ViewType = 'dashboard' | 'myloans' | 'apply' | 'transactions' | 'payments' | 'settings';

function getWalletErrorMessage(error: WalletError): string {
    const name = (error as unknown as { name?: string }).name || '';
    const message = error.message || String(error);
    if (name === 'WalletNotReadyError' || /not ready|not found|not detected|no provider/i.test(message)) {
        return 'Leo Wallet extension not detected. Install it from leo.app and refresh this page.';
    }
    // Don't show errors for permission denied - check this first
    if (name === 'WalletRecordsError' || /permission.*not.*granted|NOT_GRANTED/i.test(message)) {
        return ''; // Suppress permission errors
    }
    
    // Only show connection error if it's actually a connection issue
    if (name === 'WalletConnectionError' || (/connection|connect failed/i.test(message) && !/permission|NOT_GRANTED/i.test(message))) {
        return 'Connection failed. Unlock Leo Wallet, ensure you’re on Testnet, and try again.';
    }
    if (name === 'WalletLoadError') {
        return 'Could not load wallet. Refresh the page or try another browser.';
    }
    return message || 'Wallet error. Try again.';
}

const App: FC = () => {
    const [currentView, setCurrentView] = useState<ViewType>('dashboard');
    const [walletError, setWalletError] = useState<string | null>(null);

    const handleWalletError = useCallback((error: WalletError) => {
        const errorMessage = getWalletErrorMessage(error);
        
        // Only log permission denied errors, don't show them in UI
        const name = (error as unknown as { name?: string }).name || '';
        const message = error.message || String(error);
        const isPermissionError = name === 'WalletRecordsError' || 
                                 /permission.*not.*granted|not.*granted/i.test(message) ||
                                 (/record|decrypt|plaintext/i.test(message) && /permission|denied|not.*granted/i.test(message));
        
        if (isPermissionError) {
            // Just log, don't show error banner for permission denied
            console.log('Decryption permission denied (this is normal - user can approve when needed):', error);
            return;
        }
        
        console.error('Wallet error:', error);
        if (errorMessage) {
            setWalletError(errorMessage);
        }
    }, []);

    const clearWalletError = useCallback(() => setWalletError(null), []);

    // Configure wallet adapters with useMemo to prevent re-initialization.
    // Only create adapters in browser (avoids SSR/hydration issues).
    const wallets = useMemo(() => {
        if (typeof window === 'undefined') return [];
        return [
            new LeoWalletAdapter({
                appName: 'Private Credit Score',
            }),
        ];
    }, []);

    const programs = useMemo(
        () => [CREDIT_SCORE_PROGRAM, LOAN_MANAGER_PROGRAM, PAYMENT_TRACKER_PROGRAM],
        []
    );

    return (
        <WalletProvider
            wallets={wallets}
            autoConnect={false}
            network={WalletAdapterNetwork.TestnetBeta}
            programs={programs}
            decryptPermission={DecryptPermission.UponRequest}
            onError={handleWalletError}
        >
            <WalletModalProvider>
                <div className="app">
                    {walletError && (
                        <div className="wallet-error-banner" role="alert">
                            <span>{walletError}</span>
                            <button
                                type="button"
                                className="wallet-error-dismiss"
                                onClick={clearWalletError}
                                aria-label="Dismiss"
                            >
                                ×
                            </button>
                        </div>
                    )}
                    <Header currentView={currentView} setCurrentView={setCurrentView} />
                    <main className="main-content">
                        <div className="container">
                            <Dashboard currentView={currentView} />
                        </div>
                    </main>
                </div>
            </WalletModalProvider>
        </WalletProvider>
    );
};

export default App;
