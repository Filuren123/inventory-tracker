import { useState, type FormEvent } from 'react';
import { login } from '../../api/user';
import { errorMessage, statusOf } from '../../api/axios';
import './LoginPage.css';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
            await login(username, password);
            window.location.assign('/');
        } catch (err) {
            setError(statusOf(err) === 401 ? 'Wrong username or password.' : errorMessage(err, 'Login failed'));
            setBusy(false);
        }
    };

    return (
        <div className="login-page">
            <form className="panel panel-body login-form" onSubmit={submit}>
                <h1>Inventory</h1>
                <p className="muted">Log in to continue.</p>
                <div className="field">
                    <label htmlFor="username">Username</label>
                    <input
                        id="username"
                        className="input"
                        autoComplete="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoFocus
                        required
                    />
                </div>
                <div className="field">
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        className="input"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                {error && (
                    <div className="alert alert-error" role="alert">
                        {error}
                    </div>
                )}
                <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
                    {busy ? 'Logging in…' : 'Log in'}
                </button>
            </form>
        </div>
    );
};

export default LoginPage;
