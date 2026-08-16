import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('orange_fare_token'));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('orange_fare_user');
    return raw ? JSON.parse(raw) : null;
  });

  const login = (nextToken, nextUser) => {
    localStorage.setItem('orange_fare_token', nextToken);
    localStorage.setItem('orange_fare_user', JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem('orange_fare_token');
    localStorage.removeItem('orange_fare_user');
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ isAuthenticated: Boolean(token), token, user, login, logout }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
