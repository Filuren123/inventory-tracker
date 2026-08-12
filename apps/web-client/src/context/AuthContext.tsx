// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getCurrentUser } from '../api/user';

interface AuthContextType {
    isAuthenticated: boolean;
    loading: boolean;
    user: { username: string } | null;
    checkAuth: () => Promise<void>;
    setLoggedOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{ username: string } | null>(null);

    const checkAuth = async () => {
        try {
            const data = await getCurrentUser(); // hits GET /api/users/me
            setUser(data.user);
            setIsAuthenticated(true);
        } catch {
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    const setLoggedOut = () => {
        setUser(null);
        setIsAuthenticated(false);
    };

    useEffect(() => {
        checkAuth();
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthenticated, loading, user, checkAuth, setLoggedOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};