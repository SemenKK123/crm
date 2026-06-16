import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';
import { User } from '../types';

interface AuthCtx { user: User | null; login: (email: string, password: string) => Promise<void>; logout: () => void; loading: boolean; }
const AuthContext = createContext<AuthCtx>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me').then(r => setUser(r.data)).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const r = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', r.data.token);
    setUser(r.data.user);
  };

  const logout = () => { localStorage.removeItem('token'); setUser(null); };

  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
