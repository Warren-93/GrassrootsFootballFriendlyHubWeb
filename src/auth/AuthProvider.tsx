import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { authRepository } from '../api/authRepository';
import { REFRESH_RETRY_DELAYS_MS } from '../api/client';
import type { UserView } from '../api/types';
import { AuthContext } from './AuthContext';
import { setPostAuthRedirect } from '../routes/postAuthRedirect';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<UserView | null>(null);
  const [loading, setLoading] = useState(true);

  async function resolveSession(): Promise<UserView | null> {
    if (!(await authRepository.restoreSession())) {
      setSession(null);
      setLoading(false);
      return null;
    }
    let result = await authRepository.me();
    // A network error or 5xx here (the API waking up) isn't a signed-out user.
    for (const delay of REFRESH_RETRY_DELAYS_MS) {
      if (result.ok || (result.status !== undefined && result.status < 500)) break;
      await new Promise((resolve) => setTimeout(resolve, delay));
      result = await authRepository.me();
    }
    const user = result.ok ? result.value : null;
    setSession(user);
    setLoading(false);
    return user;
  }

  async function signOut() {
    setSession(null);
    await authRepository.signOut();
    // The page signed out from isn't one to return to on the next sign-in
    // (ProtectedRoute noted it as the session went).
    setPostAuthRedirect(null);
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
