// Mirrors mobile's SearchFilterState + SearchResultsCache + InvitationDraftState:
// cross-screen state that isn't auth. Plain module-level state (not React
// context) is enough here since these are single-flight, not shared across
// concurrent screens the way team/session state is.
import { create } from 'zustand';
import type { CostShare, MatchSummary, RefereeArrangement, SearchRequest, SearchResponse } from '../api/types';

// Optional refinements on top of the default search, which already shows
// every team with the same age group and gender. Empty means "all".
export interface SearchFilters {
  abilityLevels: string[];
  formats: string[];
  maxDistanceMiles: number | null;
  verifiedOnly: boolean;
}

export const EMPTY_FILTERS: SearchFilters = {
  abilityLevels: [],
  formats: [],
  maxDistanceMiles: null,
  verifiedOnly: false,
};

interface SearchFilterState extends SearchFilters {
  setFilters: (patch: Partial<SearchFilters>) => void;
  reset: () => void;
}

export const useSearchFilterStore = create<SearchFilterState>((set) => ({
  ...EMPTY_FILTERS,
  setFilters: (patch) => set(patch),
  reset: () => set(EMPTY_FILTERS),
}));

/** The search request for a team with the given filters - unset filters are omitted. */
export function searchRequestFor(teamId: string, filters: SearchFilters, limit = 50): SearchRequest {
  return {
    teamId,
    abilityLevels: filters.abilityLevels.length ? filters.abilityLevels : null,
    formats: filters.formats.length ? filters.formats : null,
    maxDistanceMiles: filters.maxDistanceMiles,
    verifiedOnly: filters.verifiedOnly || null,
    limit,
  };
}

interface SearchResultsState {
  response: SearchResponse | null;
  setResponse: (response: SearchResponse | null) => void;
  findTeam: (teamId: string) => MatchSummary | null;
}

export const useSearchResultsStore = create<SearchResultsState>((set, get) => ({
  response: null,
  setResponse: (response) => set({ response }),
  findTeam: (teamId) => get().response?.results.find((r) => r.team.id === teamId) ?? null,
}));

export interface InvitationDraft {
  opponentTeamId: string;
  ourSlotId: string;
  theirSlotId: string;
  date: string;
  startTime: string;
  endTime: string;
  venueId: string | null;
  homeTeamId: string;
  costShare: CostShare;
  refereeArrangement: RefereeArrangement;
  message: string;
}

interface InvitationDraftStoreState {
  draft: InvitationDraft | null;
  setDraft: (draft: InvitationDraft | null) => void;
}

export const useInvitationDraftStore = create<InvitationDraftStoreState>((set) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
}));
