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
  /** Absent in the cookie flow, where the API keeps it in an httpOnly cookie. */
  refreshToken?: string | null;
  tokenType: string;
  expiresIn: number;
  user: UserView;
  /** Only present while no real email provider is connected - see EmailVerificationPage. */
  verificationToken: string | null;
  /** Google/Apple sign-in only: true when this sign-in created the account (it then goes to onboarding). */
  newUser?: boolean;
}

export type OAuthProvider = 'google' | 'apple';

/** POST /api/v1/auth/oauth/{provider} */
export interface OAuthSignInRequest {
  /** The provider's ID token: Google's credential, or Apple's authorization.id_token. */
  idToken: string;
  /** Apple only - its token carries no name, and it hands the name to the browser on the first sign-in only. */
  displayName?: string | null;
}

export interface VerificationResendResponse {
  /** Only present while no real email provider is connected - see EmailVerificationPage. */
  verificationToken: string | null;
  /** True when a new link was emailed. Neither set means the account is already verified. */
  emailSent?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangeEmailRequest {
  newEmail: string;
  currentPassword: string;
}

export interface ChangeEmailResponse {
  user: UserView;
  /** Only present while no real email provider is connected - see EmailVerificationPage. */
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

export interface ClubSearchView {
  id: string;
  name: string;
  badgeUrl: string | null;
  postcode: string;
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
  | 'U7' | 'U8' | 'U9' | 'U10' | 'U11' | 'U12' | 'U13' | 'U14' | 'U15' | 'U16' | 'U17' | 'U18' | 'ADULT' | 'VETERANS';
/** BOYS/GIRLS for youth age groups, MEN/WOMEN for ADULT/VETERANS, MIXED always allowed - see Gender.availableFor on the backend. */
export type Gender = 'BOYS' | 'GIRLS' | 'MIXED' | 'MEN' | 'WOMEN';
export type Format = 'FIVE_A_SIDE' | 'SEVEN_A_SIDE' | 'NINE_A_SIDE' | 'ELEVEN_A_SIDE';
export type AbilityLevel = 'DEVELOPMENT' | 'INTERMEDIATE' | 'COMPETITIVE';
export type HomeAwayPreference = 'HOME' | 'AWAY' | 'EITHER';
export type VerificationStatus = 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export type PitchSurface = 'GRASS' | 'THREE_G' | 'FOUR_G' | 'ASTRO' | 'INDOOR';
export type VenueFacility = 'CHANGING_ROOMS' | 'PARKING' | 'FLOODLIGHTS' | 'REFRESHMENTS' | 'TOILETS' | 'SPECTATOR_AREA';
export type CostShare = 'NONE' | 'SPLIT' | 'HOST_PAYS' | 'VISITOR_PAYS';
export type RefereeArrangement = 'NONE' | 'CLUB_SUPPLIED' | 'APPOINTED';

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
  archived: boolean;
  createdAt: string;
  /** Only set on GET /teams/mine. */
  canManage?: boolean | null;
  /** Verified and has a venue: the only gate on sending and receiving friendly requests. */
  readyForRequests?: boolean;
  /** What's still to do. Empty for teams the caller doesn't manage. */
  profileChecklist?: ProfileChecklistItem[];
}

export interface ProfileChecklistItem {
  key: string;
  label: string;
  done: boolean;
  /** True for the items that gate friendly requests (verification, venue). */
  requiredForRequests: boolean;
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
  /** The postcode entered for the venue, else one found in its address. Absent from an older API. */
  postcode?: string | null;
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
  /** Up to 10 characters. On an update, null keeps the current one. */
  postcode?: string | null;
  longitude: number;
  latitude: number;
  pitchSurface?: PitchSurface | null;
  facilities?: VenueFacility[];
  accessNotes?: string | null;
  parkingNotes?: string | null;
  pitchNumber?: string | null;
}

export type UpdateVenueRequest = Partial<Omit<CreateVenueRequest, 'clubId'>>;

export type SlotStatus = 'AVAILABLE' | 'RESERVED' | 'BOOKED' | 'WITHDRAWN';

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

export interface BulkCreateSlotRequest {
  dates: string[];
  startTime: string;
  endTime: string;
  homeAwayPreference: HomeAwayPreference;
  venueId?: string | null;
  format?: string | null;
  notes?: string | null;
}

export interface BulkCreateResult {
  created: SlotView[];
  skippedPastDates: string[];
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
  ignoreTravelRadius?: boolean | null;
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
  /** False until the opponent is verified and has a venue. */
  canReceiveRequests?: boolean;
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
  | 'DRAFT' | 'SENT' | 'CHANGES_REQUESTED' | 'UPDATED' | 'ACCEPTED' | 'CONFIRMED' | 'DECLINED' | 'CANCELLED' | 'COMPLETED';

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
  teamName?: string | null;
  managerName: string | null;
  contactPhone: string | null;
  venueId: string | null;
}

/** The venue details shown on a request or fixture - any field but id and name may be null. */
export interface VenueSummary {
  id: string;
  name: string;
  address: string | null;
  postcode: string | null;
  pitchSurface: PitchSurface | null;
  accessNotes: string | null;
  parkingNotes: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface TeamRef {
  id: string;
  name: string;
  clubName: string | null;
  badgeUrl: string | null;
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
  /** A pending counter-proposal from suggestChanges - date isn't proposable, only time/venue. */
  proposedStartTime: string | null;
  proposedEndTime: string | null;
  proposedVenueId: string | null;
  /** The agreed venue: the request's venueId, else the home team's default venue. */
  venue?: VenueSummary | null;
  /** Set while a suggested change proposes a different venue. */
  proposedVenue?: VenueSummary | null;
  senderTeam?: TeamRef | null;
  recipientTeam?: TeamRef | null;
}

export interface SuggestChangesBody {
  reason?: string;
  proposedStartTime?: string;
  proposedEndTime?: string;
  proposedVenueId?: string;
}

export type FixtureStatus = 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface FixtureTeamView {
  id: string;
  name: string;
  clubName: string;
  managerName: string | null;
  contactPhone: string | null;
  venueId: string | null;
  badgeUrl?: string | null;
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
  /** The fixture's venue, else the home team's default venue. */
  venue?: VenueSummary | null;
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

export interface PrivacyPreferences {
  searchVisible: boolean;
  shareContactDetails: boolean;
}

export interface BlockView {
  id: string;
  blockedTeamId: string;
  blockedTeamName: string;
  reason: string | null;
  createdAt: string;
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

/** A pending invitation for an email with no account yet - it becomes a membership once they verify that email. */
export interface InviteView {
  id: string;
  email: string;
  role: MemberRole;
  teamId: string;
  teamName: string;
  createdAt: string;
  expiresAt: string;
}

/** The 202 body when the email added has no account yet: an invitation was emailed instead. */
export interface MemberInvitedResponse {
  status: 'INVITED';
  invite: InviteView;
}

/** POST .../members answers 201 with the new member, or 202 with an invitation. */
export type AddMemberResult = MemberView | MemberInvitedResponse;

export interface UpdateMemberRoleRequest {
  role: MemberRole;
}

export interface JoinCodeView {
  code: string;
}

export interface JoinResultView {
  teamId: string;
  teamName: string;
  clubId: string;
  membership: MemberView;
}

export type VerificationRequestStatus = 'PENDING' | 'AWAITING_SECOND_REJECTION' | 'APPROVED' | 'REJECTED';

export interface VerificationRequestView {
  id: string;
  teamId: string;
  affiliationNumber: string | null;
  contactDetails: string;
  evidenceUrls: string[];
  status: VerificationRequestStatus;
  firstRejectionReason: string | null;
  finalRejectionReason: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface SubmitVerificationRequest {
  affiliationNumber?: string | null;
  contactDetails: string;
  evidenceUrls: string[];
}

export interface MembershipExport {
  membershipId: string;
  role: string;
  scope: 'TEAM' | 'CLUB';
  teamId: string | null;
  teamName: string | null;
  clubId: string | null;
  clubName: string | null;
  joinedAt: string;
}

export interface AccountExport {
  userId: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  createdAt: string;
  memberships: MembershipExport[];
}

export type NotificationType =
  | 'REQUEST_RECEIVED'
  | 'REQUEST_ACCEPTED'
  | 'REQUEST_DECLINED'
  | 'REQUEST_CHANGES_REQUESTED'
  | 'REQUEST_WITHDRAWN'
  | 'FIXTURE_CONFIRMED'
  | 'FIXTURE_CANCELLED'
  | 'VERIFICATION_APPROVED'
  | 'VERIFICATION_REJECTED'
  | 'MESSAGE_RECEIVED';

export interface NotificationView {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  relatedTeamId: string | null;
  relatedRequestId: string | null;
  relatedFixtureId: string | null;
  relatedConversationId: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationPreferenceView {
  friendlyRequests: boolean;
  fixtures: boolean;
  verification: boolean;
  messages: boolean;
  /** How notifications reach the user beyond the app itself. Both default to true server-side. */
  emailEnabled: boolean;
  pushEnabled: boolean;
}

export interface MessageView {
  id: string;
  conversationId: string;
  senderTeamId: string;
  senderUserId: string;
  body: string;
  createdAt: string;
}

export interface ConversationView {
  id: string;
  otherTeam: TeamSummary;
  lastMessageBody: string | null;
  lastMessageSenderTeamId: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  /** What this thread is currently about - set when opened from a fixture's "Message" entry point. */
  relatedFixtureId: string | null;
}

/** GET /api/v1/config - public settings the web app needs before anyone signs in. */
export interface ClientConfig {
  supportEmail: string | null;
  google: { enabled: boolean; clientId: string | null };
  apple: { enabled: boolean; servicesId: string | null };
}
