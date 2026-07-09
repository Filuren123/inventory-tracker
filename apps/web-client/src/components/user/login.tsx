import { login } from '../../api/user';
import { useState } from 'react';

const LoginPage = () => {

    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredentials(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await login(credentials.username, credentials.password);
            localStorage.setItem('accessToken', response.accessToken);
            window.location.href = '/';
        } catch (error) {
            console.error('Login failed:', error);
        }
    }

    return (
        <>
            <form onSubmit={handleSubmit}>
                <input type="text" name="username" value={credentials.username} onChange={handleChange}/>
                <input type="password" name="password" value={credentials.password} onChange={handleChange}/>
                <button type="submit">Login</button>
            </form>
        </>
    )
}
export default LoginPage;