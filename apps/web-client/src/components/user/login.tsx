import { login } from '../../api/user';
import { useState } from 'react';

const LoginPage = () => {

    const [credentials, setCredentials] = useState({ username: '', password: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await login(credentials.username, credentials.password);
            const 
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