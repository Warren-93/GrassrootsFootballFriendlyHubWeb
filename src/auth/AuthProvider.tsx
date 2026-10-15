import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { authRepository } from '../api/authRepository';
import type { UserView } from '../api/types';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<UserView | null>(null);
  const [loading, setLoading] = useState(true);

  async function resolveSession(): Promise<UserView | null> {
    if (!(await authRepository.restoreSession())) {
      setSession(null);
      setLoading(false);
      return null;
    }
    const result = await authRepository.me();
    const user = result.ok ? result.value : null;
    setSession(user);
    setLoading(false);
    return user;
  }

  async function signOut() {
    setSession(null);
    await authRepository.signOut();
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
