import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('access_token'));
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('access_token');
        const storedName = localStorage.getItem('user_name');
        if (storedToken) {
            setToken(storedToken);
            setUser({ name: storedName || 'Explorer' });
        }
        setLoading(false);
    }, []);

    const login = (data) => {
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user_name', data.user_name || 'Explorer');
        setToken(data.access_token);
        setUser({ name: data.user_name || 'Explorer' });
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_name');
        localStorage.removeItem('refresh_token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ token, user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
