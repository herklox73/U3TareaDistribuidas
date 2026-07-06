import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

function decodeToken(token) {
  if (!token) return null;
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(escape(atob(base64))));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => localStorage.getItem('token'));

  const user = useMemo(() => decodeToken(token), [token]);

  const setToken = (value) => {
    if (value) localStorage.setItem('token', value);
    else localStorage.removeItem('token');
    setTokenState(value);
  };

  const value = {
    token,
    user,
    role: user?.role || null,
    isAuthenticated: !!token,
    setToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
