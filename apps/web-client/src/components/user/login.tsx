import { login } from '../../api/user';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './login.css';

const LoginPage = () => {

    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const { checkAuth } = useAuth();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredentials(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await login(credentials.username, credentials.password);
            await checkAuth();
            window.location.href = '/';
        } catch (err) {
            console.error('Login failed:', err);
            setError('Invalid username or password');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <h1 className="login-title">Sign in</h1>
                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="login-field">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            name="username"
                            value={credentials.username}
                            onChange={handleChange}
                            autoComplete="username"
                            required
                        />
                    </div>
                    <div className="login-field">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            value={credentials.password}
                            onChange={handleChange}
                            autoComplete="current-password"
                            required
                        />
                    </div>
                    {error && <p className="login-error">{error}</p>}
                    <button className="login-button" type="submit" disabled={submitting}>
                        {submitting ? 'Signing in…' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    )
}
export default LoginPage;