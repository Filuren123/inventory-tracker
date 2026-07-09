import { useEffect, useState } from 'react';
import { logout } from '../../api/user';

const LogoutPage = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    logout()
      .then(() => { window.location.href = '/login'; })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <p style={{ color: 'red' }}>Logout failed: {error}</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <p>Logging out…</p>
    </div>
  );
};

export default LogoutPage;