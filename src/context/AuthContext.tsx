import { createContext, useContext, useEffect, useState } from 'react';
import { login } from '../lib/api';

export interface User {
  user_id: number;
  email: string;
  name?: string;
}

interface AuthContextValue {
  user: User | null;
  loginWithEmail: (email: string, name?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = 'amazocart:user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const loginWithEmail = async (email: string, name?: string) => {
    const res = await login(email, name);
    const userObj = { user_id: res.user_id, email: res.email, name: res.name };
    setUser(userObj);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userObj));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, loginWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
