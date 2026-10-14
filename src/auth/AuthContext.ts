import { createContext, useContext } from 'react';
import type { UserView } from '../api/types';

export interface AuthContextValue {
  session: UserView | null;
  loading: boolean;
  resolveSession: () => Promise<void>;
  signOut: () => Promise<void>;
  setSession: (user: UserView | null) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
