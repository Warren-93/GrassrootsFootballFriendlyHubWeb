import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import { SplashScreen } from './SplashScreen';

/** Shows the splash screen only while the session is being resolved on load, then reveals the app. */
export function SplashGate({ children }: { children: ReactNode }) {
  const { loading } = useAuth();
  if (loading) return <SplashScreen />;
  return <>{children}</>;
}
