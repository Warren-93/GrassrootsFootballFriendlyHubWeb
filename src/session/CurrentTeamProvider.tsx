import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { CurrentTeamContext } from './CurrentTeamContext';
import type { ActiveTeam } from './CurrentTeamContext';

const STORAGE_KEY = 'gffh.activeTeam';

export function CurrentTeamProvider({ children }: { children: ReactNode }) {
  const [active, setActiveState] = useState<ActiveTeam | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ActiveTeam) : null;
  });

  useEffect(() => {
    if (active) localStorage.setItem(STORAGE_KEY, JSON.stringify(active));
    else localStorage.removeItem(STORAGE_KEY);
  }, [active]);

  return (
    <CurrentTeamContext.Provider
      value={{ active, setActive: setActiveState, clear: () => setActiveState(null) }}
    >
      {children}
    </CurrentTeamContext.Provider>
  );
}
