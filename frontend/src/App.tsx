import { FC, useMemo, useState } from 'react';
import { WalletProvider } from '@demox-labs/aleo-wallet-adapter-react';
import { WalletModalProvider } from '@demox-labs/aleo-wallet-adapter-reactui';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import Header from './components/Header';
import Dashboard from './components/Dashboard';

// Import wallet adapter styles
import '@demox-labs/aleo-wallet-adapter-reactui/styles.css';
import './App.css';

export type ViewType = 'dashboard' | 'myloans' | 'apply';

const App: FC = () => {
    const [currentView, setCurrentView] = useState<ViewType>('dashboard');

    // Configure wallet adapters with useMemo to prevent re-initialization
    const wallets = useMemo(
        () => [
            new LeoWalletAdapter({
                appName: 'Private Credit Score',
            }),
        ],
        []
    );

    return (
        <WalletProvider
            wallets={wallets}
            autoConnect={false}
        >
            <WalletModalProvider>
                <div className="app">
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
