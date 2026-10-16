import { useEffect, useState } from 'react';
import { matchRepository } from '../api/matchRepository';
import { EMPTY_FILTERS, searchRequestFor, useSearchFilterStore, useSearchResultsStore } from './SearchState';

/**
 * Opened directly (a reload or a shared link) there's no search in memory:
 * run the default one - every team in our age group and gender - for the
 * pages that read the search results, rather than showing an empty page or
 * saying an opponent is missing. Gives back the search's error, if it
 * failed, and a way to try again.
 */
export function useDefaultSearch(teamId: string | undefined): { searchError: string | null; retry: () => void } {
  const hasResponse = useSearchResultsStore((s) => s.response !== null);
  const setResponse = useSearchResultsStore((s) => s.setResponse);
  const resetFilters = useSearchFilterStore((s) => s.reset);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (hasResponse || !teamId) return;
    let cancelled = false;
    resetFilters();
    setSearchError(null);
    matchRepository.search(searchRequestFor(teamId, EMPTY_FILTERS)).then((result) => {
      if (cancelled) return;
      if (result.ok) setResponse(result.value);
      else setSearchError(result.message);
    });
    return () => {
      cancelled = true;
    };
  }, [hasResponse, teamId, resetFilters, setResponse, retryCount]);

  return { searchError, retry: () => setRetryCount((n) => n + 1) };
}
