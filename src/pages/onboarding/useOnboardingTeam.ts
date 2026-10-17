import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { teamRepository } from '../../api/teamRepository';

export interface OnboardingTeam {
  teamId?: string;
  clubId?: string;
}

/**
 * The team the onboarding wizard is setting up. It comes in the navigation
 * state from the step before; a reload (or opening the step from a bookmark)
 * drops that state, so then it's the newest team this person manages, from
 * GET /teams/mine. Without this, a reload left the venue step failing with
 * "clubId: must not be blank".
 */
export function useOnboardingTeam(): OnboardingTeam & { loading: boolean } {
  const location = useLocation();
  const passed = (location.state as OnboardingTeam | null) ?? {};
  const [fallback, setFallback] = useState<OnboardingTeam | null>(null);
  const needsFallback = !passed.teamId;

  useEffect(() => {
    if (!needsFallback) return;
    let cancelled = false;
    (async () => {
      const result = await teamRepository.listMine();
      if (cancelled) return;
      const managed = result.ok ? result.value.filter((t) => t.canManage !== false) : [];
      const newest = [...managed].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))[0];
      setFallback(newest ? { teamId: newest.id, clubId: newest.clubId } : {});
    })();
    return () => {
      cancelled = true;
    };
  }, [needsFallback]);

  if (!needsFallback) return { ...passed, loading: false };
  return { ...(fallback ?? {}), loading: fallback === null };
}
