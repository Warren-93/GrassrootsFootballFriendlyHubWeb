// Mirrors mobile's SearchFilterState + SearchResultsCache + InvitationDraftState:
// cross-screen state that isn't auth. Plain module-level state (not React
// context) is enough here since these are single-flight, not shared across
// concurrent screens the way team/session state is.
import { create } from 'zustand';
import type { CostShare, MatchSummary, RefereeArrangement, SearchResponse } from '../api/types';

interface SearchFilterState {
  formats: string[];
  abilityLevels: string[];
  maxDistanceMiles: number | null;
  verifiedOnly: boolean;
  venueRequired: boolean;
  setFilters: (patch: Partial<Omit<SearchFilterState, 'setFilters' | 'reset'>>) => void;
  reset: () => void;
}

export const useSearchFilterStore = create<SearchFilterState>((set) => ({
  formats: [],
  abilityLevels: [],
  maxDistanceMiles: null,
  verifiedOnly: false,
  venueRequired: false,
  setFilters: (patch) => set(patch),
  reset: () => set({ formats: [], abilityLevels: [], maxDistanceMiles: null, verifiedOnly: false, venueRequired: false }),
}));

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
