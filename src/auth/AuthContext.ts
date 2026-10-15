import { createContext, useContext } from 'react';
import type { UserView } from '../api/types';

export interface AuthContextValue {
  session: UserView | null;
  loading: boolean;
  /** Re-reads the signed-in user (or null) and returns it, so callers needn't wait for a re-render. */
  resolveSession: () => Promise<UserView | null>;
  signOut: () => Promise<void>;
  setSession: (user: UserView | null) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
