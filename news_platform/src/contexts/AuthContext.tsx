import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, LoginCredentials } from '../types/userTypes';
import { login as apiLogin, logout as apiLogout} from '../services/authService';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('nije moguce koristiti useAuth izvan AuthProvider-a');
    }
    return context;
};

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');
            
            if (token && storedUser) {
                try {
                    const userData = JSON.parse(storedUser);
                    setUser(userData);
                } catch (error) {
                    console.error('Greska pri ucitavanju korisnika:', error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }
            setLoading(false);
        };
        
        initAuth();
    }, []);

    const login = async (credentials: LoginCredentials) => {
        const response = await apiLogin(credentials);
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
    };

    const logout = async () => {
        await apiLogout();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            logout,
            isAuthenticated: !!user,
            isAdmin: user?.user_type === 'admin'
        }}>
            {children}
        </AuthContext.Provider>
    );
};