import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { SplashScreen } from './SplashScreen';

const SPLASH_DURATION_MS = 5000;

/** Shows the splash screen for a fixed duration on cold load, then reveals the app. */
export function SplashGate({ children }: { children: ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) return <SplashScreen />;
  return <>{children}</>;
}
