import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User } from '@/types';
import { DEMO_USERS } from '@/lib/mockData';
import { getAuthUser, setAuthUser, clearAuth, initStorage } from '@/lib/storage';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (userId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    initStorage();
    const auth = getAuthUser();
    if (auth) {
      const found = DEMO_USERS.find(u => u.id === auth.userId);
      if (found) setUser(found);
    }
  }, []);

  const login = useCallback((userId: string) => {
    const found = DEMO_USERS.find(u => u.id === userId);
    if (found) {
      setUser(found);
      setAuthUser(found.id, found.role);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    clearAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
