import { FC, useState } from 'react';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { Settings as SettingsIcon, Moon, Sun, Bell, Shield, Eye, EyeOff } from 'lucide-react';

const Settings: FC = () => {
    const wallet = useWallet();
    const { connected, publicKey } = wallet;
    const [showScore, setShowScore] = useState(true);
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(true); // Assuming dark mode is default

    if (!connected) {
        return (
            <div className="card">
                <h3 style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <SettingsIcon size={24} />
                    Settings
                </h3>
                <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', opacity: 0.6 }}>
                    <SettingsIcon size={48} style={{ opacity: 0.3, marginBottom: 'var(--spacing-md)' }} />
                    <p>Connect your wallet to access settings</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <h3 style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                <SettingsIcon size={24} />
                Settings
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                {/* Privacy Settings */}
                <div>
                    <h4 style={{ marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        <Shield size={18} />
                        Privacy
                    </h4>
                    <div style={{
                        padding: 'var(--spacing-md)',
                        background: 'var(--bg-hover)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 'bold', marginBottom: 'var(--spacing-xs)' }}>
                                    Show Credit Score
                                </div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                    Toggle visibility of your credit score in the dashboard
                                </div>
                            </div>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowScore(!showScore)}
                                style={{ padding: 'var(--spacing-xs)' }}
                            >
                                {showScore ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Notification Settings */}
                <div>
                    <h4 style={{ marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        <Bell size={18} />
                        Notifications
                    </h4>
                    <div style={{
                        padding: 'var(--spacing-md)',
                        background: 'var(--bg-hover)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 'bold', marginBottom: 'var(--spacing-xs)' }}>
                                    Payment Reminders
                                </div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                    Get notified before payment due dates
                                </div>
                            </div>
                            <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                                <input
                                    type="checkbox"
                                    checked={notifications}
                                    onChange={(e) => setNotifications(e.target.checked)}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span style={{
                                    position: 'absolute',
                                    cursor: 'pointer',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: notifications ? 'var(--accent-green)' : 'var(--text-muted)',
                                    borderRadius: '24px',
                                    transition: '0.3s',
                                }}>
                                    <span style={{
                                        position: 'absolute',
                                        content: '""',
                                        height: '18px',
                                        width: '18px',
                                        left: notifications ? '24px' : '3px',
                                        bottom: '3px',
                                        backgroundColor: 'white',
                                        borderRadius: '50%',
                                        transition: '0.3s',
                                    }} />
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Account Info */}
                <div>
                    <h4 style={{ marginBottom: 'var(--spacing-md)' }}>
                        Account Information
                    </h4>
                    <div style={{
                        padding: 'var(--spacing-md)',
                        background: 'var(--bg-hover)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                    }}>
                        <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>
                                Wallet Address
                            </div>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.875rem', wordBreak: 'break-all' }}>
                                {publicKey || 'Not connected'}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>
                                Network
                            </div>
                            <div style={{ fontSize: '0.875rem' }}>
                                Aleo Testnet Beta
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Banner */}
                <div style={{
                    padding: 'var(--spacing-md)',
                    background: 'rgba(99, 102, 241, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)'
                }}>
                    <strong>Privacy Note:</strong> All settings are stored locally in your browser. 
                    Your credit data remains encrypted on-chain and is never shared with third parties.
                </div>
            </div>
        </div>
    );
};

export default Settings;
