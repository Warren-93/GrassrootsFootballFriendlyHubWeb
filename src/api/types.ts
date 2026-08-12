// Wire types, field-for-field matches to gffh-api's Java DTOs (see
// gffh-api/src/main/java/com/gffh/api/web/*Dtos.java). Kept as one file since
// they're small and this is the single source of truth for the API contract.

export interface UserView {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserView;
  /** Only present while no real email provider is connected - see EmailVerificationPage. */
  verificationToken: string | null;
}

export interface VerificationResendResponse {
  verificationToken: string | null;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ClubView {
  id: string;
  name: string;
  badgeUrl: string | null;
  postcode: string;
  longitude: number | null;
  latitude: number | null;
  website: string | null;
  contactEmail: string | null;
  createdAt: string;
}

export interface CreateClubRequest {
  name: string;
  badgeUrl?: string | null;
  postcode: string;
  longitude: number;
  latitude: number;
  website?: string | null;
  contactEmail?: string | null;
}

export type UpdateClubRequest = Partial<CreateClubRequest>;

export type AgeGroup =
  | 'U7' | 'U8' | 'U9' | 'U10' | 'U11' | 'U12' | 'U13' | 'U14' | 'U15' | 'U16' | 'U17' | 'U18' | 'ADULT';
export type Gender = 'MALE' | 'FEMALE' | 'MIXED';
export type Format = 'FIVE_A_SIDE' | 'SEVEN_A_SIDE' | 'NINE_A_SIDE' | 'ELEVEN_A_SIDE';
export type AbilityLevel = 'RECREATIONAL' | 'INTERMEDIATE' | 'COMPETITIVE' | 'ELITE';
export type HomeAwayPreference = 'HOME' | 'AWAY' | 'EITHER';
export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export type PitchSurface = 'GRASS' | 'THREE_G' | 'FOUR_G' | 'ASTRO' | 'INDOOR';
export type VenueFacility = 'CHANGING_ROOMS' | 'PARKING' | 'FLOODLIGHTS' | 'REFRESHMENTS' | 'TOILETS' | 'SPECTATOR_AREA';
export type CostShare = 'SPLIT' | 'HOME_PAYS' | 'AWAY_PAYS' | 'NONE';
export type RefereeArrangement = 'HOME_ARRANGES' | 'AWAY_ARRANGES' | 'SPLIT_COST' | 'NONE';

export interface TeamView {
  id: string;
  clubId: string;
  name: string;
  clubName: string;
  badgeUrl: string | null;
  ageGroup: AgeGroup;
  gender: Gender;
  format: Format;
  abilityLevel: AbilityLevel;
  league: string | null;
  postcode: string;
  longitude: number;
  latitude: number;
  travelRadiusMiles: number;
  homeAwayPreference: HomeAwayPreference;
  managerName: string | null;
  contactPhone: string | null;
  description: string | null;
  verification: VerificationStatus;
  defaultVenueId: string | null;
  completenessPercent: number;
  createdAt: string;
}

export interface CreateTeamRequest {
  clubId?: string | null;
  clubName?: string | null;
  name: string;
  badgeUrl?: string | null;
  ageGroup: AgeGroup;
  gender: Gender;
  format?: Format | null;
  abilityLevel: AbilityLevel;
  league?: string | null;
  postcode: string;
  longitude: number;
  latitude: number;
  travelRadiusMiles: number;
  homeAwayPreference: HomeAwayPreference;
  managerName?: string | null;
  contactPhone?: string | null;
  description?: string | null;
  defaultVenueId?: string | null;
}

export type UpdateTeamRequest = Partial<Omit<CreateTeamRequest, 'clubId' | 'clubName'>>;

export interface VenueView {
  id: string;
  clubId: string;
  name: string;
  address: string;
  longitude: number;
  latitude: number;
  pitchSurface: PitchSurface | null;
  facilities: VenueFacility[];
  accessNotes: string | null;
  parkingNotes: string | null;
  pitchNumber: string | null;
  isDefault: boolean;
  createdAt: string;
}

export interface CreateVenueRequest {
  clubId: string;
  name: string;
  address: string;
  longitude: number;
  latitude: number;
  pitchSurface?: PitchSurface | null;
  facilities?: VenueFacility[];
  accessNotes?: string | null;
  parkingNotes?: string | null;
  pitchNumber?: string | null;
}

export type UpdateVenueRequest = Partial<Omit<CreateVenueRequest, 'clubId'>>;

export type SlotStatus = 'OPEN' | 'PENDING' | 'BOOKED' | 'WITHDRAWN';

export interface SlotView {
  id: string;
  teamId: string;
  date: string;
  startTime: string;
  endTime: string;
  homeAwayPreference: HomeAwayPreference;
  venueId: string | null;
  format: Format | null;
  notes: string | null;
  status: SlotStatus;
}

export interface CreateSlotRequest {
  date: string;
  startTime: string;
  endTime: string;
  homeAwayPreference: HomeAwayPreference;
  venueId?: string | null;
  format?: string | null;
  notes?: string | null;
}

export interface SearchRequest {
  teamId: string;
  fromDate?: string | null;
  toDate?: string | null;
  formats?: string[] | null;
  abilityLevels?: string[] | null;
  maxDistanceMiles?: number | null;
  verifiedOnly?: boolean | null;
  venueRequired?: boolean | null;
  limit?: number | null;
  cursor?: string | null;
}

export interface TeamSummary {
  id: string;
  name: string;
  clubName: string;
  badgeUrl: string | null;
  ageGroup: string;
  gender: string;
  format: string;
  abilityLevel: string;
  league: string | null;
  description: string | null;
  generalArea: string | null;
  verified: boolean;
}

export interface FactorView {
  factor: string;
  label: string;
  weight: number;
  ratio: number;
  points: number;
  ourValue: string | null;
  theirValue: string | null;
  reason: string;
}

export interface OverlapView {
  date: string;
  startTime: string;
  overlapMinutes: number;
  ourSlotId: string;
  theirSlotId: string;
}

export interface MatchSummary {
  team: TeamSummary;
  score: number;
  band: string;
  milesApart: number;
  reasons: string[];
  factors: FactorView[];
  earliestOverlap: OverlapView | null;
}

export interface WeightsView {
  age: number;
  availability: number;
  format: number;
  distance: number;
  homeAway: number;
  ability: number;
}

export interface SearchResponse {
  searchId: string;
  totalResults: number;
  results: MatchSummary[];
  weights: WeightsView;
  nextCursor: string | null;
}

export type RequestStatus =
  | 'SENT' | 'CHANGES_REQUESTED' | 'UPDATED' | 'CONFIRMED' | 'DECLINED' | 'WITHDRAWN' | 'CANCELLED';

export interface SendRequestBody {
  senderTeamId: string;
  recipientTeamId: string;
  senderSlotId: string;
  recipientSlotId: string;
  date: string;
  startTime: string;
  endTime: string;
  venueId?: string | null;
  homeTeamId: string;
  costShare: CostShare;
  refereeArrangement: RefereeArrangement;
  message?: string | null;
}

export interface TeamContact {
  teamId: string;
  managerName: string | null;
  contactPhone: string | null;
  venueId: string | null;
}

export interface FriendlyRequestView {
  id: string;
  senderTeamId: string;
  recipientTeamId: string;
  status: RequestStatus;
  date: string;
  startTime: string;
  endTime: string;
  venueId: string | null;
  homeTeamId: string;
  awayTeamId: string;
  costShare: CostShare;
  refereeArrangement: RefereeArrangement;
  message: string | null;
  actionReason: string | null;
  availableActions: string[];
  senderContact: TeamContact | null;
  recipientContact: TeamContact | null;
}

export type FixtureStatus = 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface FixtureTeamView {
  id: string;
  name: string;
  clubName: string;
  managerName: string | null;
  contactPhone: string | null;
  venueId: string | null;
}

export interface FixtureView {
  id: string;
  friendlyRequestId: string;
  homeTeam: FixtureTeamView;
  awayTeam: FixtureTeamView;
  date: string;
  startTime: string;
  endTime: string;
  venueId: string | null;
  status: FixtureStatus;
  costShare: CostShare;
  refereeArrangement: RefereeArrangement;
}

export type ReportType = 'SAFEGUARDING' | 'ABUSIVE_BEHAVIOUR' | 'FAKE_OR_MISLEADING_TEAM' | 'SPAM' | 'OTHER';
export type ReportSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'SAFEGUARDING';

export interface SubmitReportRequest {
  reportedTeamId: string;
  relatedFixtureId?: string | null;
  type: ReportType;
  severity: ReportSeverity;
  details: string;
}

export interface BlockRequest {
  blockedTeamId: string;
  reason?: string | null;
}

export type MemberRole = 'USER' | 'TEAM_MANAGER' | 'CLUB_ADMIN';
export type MemberScope = 'TEAM' | 'CLUB';

export interface MemberView {
  membershipId: string;
  userId: string;
  email: string;
  displayName: string;
  role: MemberRole;
  scope: MemberScope;
  joinedAt: string;
}

export interface AddMemberRequest {
  email: string;
  role: MemberRole;
}

export interface UpdateMemberRoleRequest {
  role: MemberRole;
}
