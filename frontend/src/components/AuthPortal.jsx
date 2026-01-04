import React, { useState } from 'react';
import { LogIn, UserPlus, FileText } from 'lucide-react';

const AuthPortal = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const url = isLogin ? '/api/token' : '/api/register';
        const body = isLogin
            ? new URLSearchParams({ username, password })
            : JSON.stringify({ username, password });

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: isLogin ? { 'Content-Type': 'application/x-www-form-urlencoded' } : { 'Content-Type': 'application/json' },
                body
            });

            const data = await res.json();
            if (res.ok) {
                if (isLogin) {
                    onLogin(data.access_token);
                } else {
                    setIsLogin(true);
                    setError('Registration successful! Please login.');
                }
            } else {
                setError(data.detail || 'Authentication failed');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="portal" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: 'radial-gradient(circle at center, #1e1b4b 0%, #09090b 100%)'
        }}>
            <div className="glass-card auth-card" style={{ width: '400px', padding: '2.5rem', textAlign: 'center' }}>
                <div className="logo" style={{ marginBottom: '2rem' }}>
                    <div className="logo-text"><span className="accent">PDF</span>Retriever <span style={{ fontWeight: 300 }}>Pro</span></div>
                </div>

                <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>

                {error && <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            placeholder="username"
                        />
                    </div>
                    <div className="input-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
                        {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                    <span
                        onClick={() => setIsLogin(!isLogin)}
                        style={{ color: 'var(--accent-color)', cursor: 'pointer', fontWeight: 600 }}
                    >
                        {isLogin ? 'Sign Up' : 'Sign In'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default AuthPortal;
