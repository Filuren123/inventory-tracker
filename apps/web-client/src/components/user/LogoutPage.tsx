import { useEffect, useState } from 'react';
import { logout } from '../../api/user';
import { errorMessage } from '../../api/axios';

const LogoutPage = () => {
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        logout()
            .then(() => window.location.assign('/login'))
            .catch((err) => setError(errorMessage(err, 'Logout failed')));
    }, []);

    return (
        <div className="page empty-state">
            {error ? <div className="alert alert-error">Logout failed: {error}</div> : 'Logging out…'}
        </div>
    );
};

export default LogoutPage;
