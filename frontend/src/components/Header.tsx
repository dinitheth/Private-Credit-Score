import { FC } from 'react';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { WalletMultiButton } from '@demox-labs/aleo-wallet-adapter-reactui';
import { Shield } from 'lucide-react';
import { ViewType } from '../App';

interface HeaderProps {
    currentView: ViewType;
    setCurrentView: (view: ViewType) => void;
}

const Header: FC<HeaderProps> = ({ currentView, setCurrentView }) => {
    const { connected } = useWallet();

    return (
        <header className="header">
            <div className="container header-content">
                <a href="/" className="logo">
                    <div className="logo-icon">
                        <Shield size={20} />
                    </div>
                    <span>Private Credit Score</span>
                </a>

                <nav className="nav">
                    {connected && (
                        <>
                            <a
                                href="#"
                                className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentView('dashboard');
                                }}
                            >
                                Dashboard
                            </a>
                            <a
                                href="#"
                                className={`nav-link ${currentView === 'myloans' ? 'active' : ''}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentView('myloans');
                                }}
                            >
                                My Loans
                            </a>
                            <a
                                href="#"
                                className={`nav-link ${currentView === 'apply' ? 'active' : ''}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentView('apply');
                                }}
                            >
                                Apply
                            </a>
                        </>
                    )}
                    <WalletMultiButton />
                </nav>
            </div>
        </header>
    );
};

export default Header;
