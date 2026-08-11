import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { authRepository } from '../api/authRepository';
import type { UserView } from '../api/types';

interface AuthContextValue {
  session: UserView | null;
  loading: boolean;
  resolveSession: () => Promise<void>;
  signOut: () => void;
  setSession: (user: UserView | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<UserView | null>(null);
  const [loading, setLoading] = useState(true);

  async function resolveSession() {
    if (!authRepository.isSignedIn()) {
      setSession(null);
      setLoading(false);
      return;
    }
    const result = await authRepository.me();
    setSession(result.ok ? result.value : null);
    setLoading(false);
  }

  function signOut() {
    authRepository.signOut();
    setSession(null);
  }

  useEffect(() => {
    resolveSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, resolveSession, signOut, setSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
