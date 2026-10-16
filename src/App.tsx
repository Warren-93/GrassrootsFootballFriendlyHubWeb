import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { PublicOnlyRoute } from './routes/PublicOnlyRoute';
import { AppShellSwitch } from './layouts/AppShellSwitch';
import { PageFallback } from './routes/PageFallback';

// Every page is its own chunk, loaded when first visited, so the first load
// only downloads the shell and the page being opened.
const WelcomePage = lazy(() => import('./pages/auth/WelcomePage').then((m) => ({ default: m.WelcomePage })));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const SignInPage = lazy(() => import('./pages/auth/SignInPage').then((m) => ({ default: m.SignInPage })));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const EmailVerificationPage = lazy(() => import('./pages/auth/EmailVerificationPage').then((m) => ({ default: m.EmailVerificationPage })));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage })));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));
const RoleSelectionPage = lazy(() => import('./pages/onboarding/RoleSelectionPage').then((m) => ({ default: m.RoleSelectionPage })));
const SelectClubPage = lazy(() => import('./pages/onboarding/SelectClubPage').then((m) => ({ default: m.SelectClubPage })));
const JoinTeamPage = lazy(() => import('./pages/onboarding/JoinTeamPage').then((m) => ({ default: m.JoinTeamPage })));
const CreateClubPage = lazy(() => import('./pages/onboarding/CreateClubPage').then((m) => ({ default: m.CreateClubPage })));
const CreateTeamPage = lazy(() => import('./pages/onboarding/CreateTeamPage').then((m) => ({ default: m.CreateTeamPage })));
const AddVenuePage = lazy(() => import('./pages/onboarding/AddVenuePage').then((m) => ({ default: m.AddVenuePage })));
const AddAvailabilityPage = lazy(() => import('./pages/onboarding/AddAvailabilityPage').then((m) => ({ default: m.AddAvailabilityPage })));
const OnboardingCompletePage = lazy(() => import('./pages/onboarding/OnboardingCompletePage').then((m) => ({ default: m.OnboardingCompletePage })));
const TeamProfilePage = lazy(() => import('./pages/profile/TeamProfilePage').then((m) => ({ default: m.TeamProfilePage })));
const EditTeamPage = lazy(() => import('./pages/profile/EditTeamPage').then((m) => ({ default: m.EditTeamPage })));
const SettingsPage = lazy(() => import('./pages/profile/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const ReportBlockPage = lazy(() => import('./pages/profile/ReportBlockPage').then((m) => ({ default: m.ReportBlockPage })));
const AccountReportPage = lazy(() => import('./pages/profile/AccountReportPage').then((m) => ({ default: m.AccountReportPage })));
const VenuesListPage = lazy(() => import('./pages/profile/VenuesListPage').then((m) => ({ default: m.VenuesListPage })));
const EditVenuePage = lazy(() => import('./pages/profile/EditVenuePage').then((m) => ({ default: m.EditVenuePage })));
const ClubProfilePage = lazy(() => import('./pages/profile/ClubProfilePage').then((m) => ({ default: m.ClubProfilePage })));
const EditClubPage = lazy(() => import('./pages/profile/EditClubPage').then((m) => ({ default: m.EditClubPage })));
const VerificationPage = lazy(() => import('./pages/profile/VerificationPage').then((m) => ({ default: m.VerificationPage })));
const PrivacyPage = lazy(() => import('./pages/profile/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));
const HelpPage = lazy(() => import('./pages/profile/HelpPage').then((m) => ({ default: m.HelpPage })));
const NotificationPreferencesPage = lazy(() => import('./pages/profile/NotificationPreferencesPage').then((m) => ({ default: m.NotificationPreferencesPage })));
const NotificationsPage = lazy(() => import('./pages/Home/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const HomePage = lazy(() => import('./pages/Home/HomePage').then((m) => ({ default: m.HomePage })));
const DashboardPage = lazy(() => import('./pages/Home/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ConversationsListPage = lazy(() => import('./pages/messages/ConversationsListPage').then((m) => ({ default: m.ConversationsListPage })));
const ConversationThreadPage = lazy(() => import('./pages/messages/ConversationThreadPage').then((m) => ({ default: m.ConversationThreadPage })));
const CalendarPage = lazy(() => import('./pages/availability/CalendarPage').then((m) => ({ default: m.CalendarPage })));
const DayDetailPage = lazy(() => import('./pages/availability/DayDetailPage').then((m) => ({ default: m.DayDetailPage })));
const EditAvailabilitySlotPage = lazy(() => import('./pages/availability/EditAvailabilitySlotPage').then((m) => ({ default: m.EditAvailabilitySlotPage })));
const BulkAddAvailabilityPage = lazy(() => import('./pages/availability/BulkAddAvailabilityPage').then((m) => ({ default: m.BulkAddAvailabilityPage })));
const SuggestedMatchesPage = lazy(() => import('./pages/discover/SuggestedMatchesPage').then((m) => ({ default: m.SuggestedMatchesPage })));
const ResultsListPage = lazy(() => import('./pages/discover/ResultsListPage').then((m) => ({ default: m.ResultsListPage })));
const OpponentProfilePage = lazy(() => import('./pages/discover/OpponentProfilePage').then((m) => ({ default: m.OpponentProfilePage })));
const MatchExplanationPage = lazy(() => import('./pages/discover/MatchExplanationPage').then((m) => ({ default: m.MatchExplanationPage })));
const InvitationComposerPage = lazy(() => import('./pages/arrange/InvitationComposerPage').then((m) => ({ default: m.InvitationComposerPage })));
const InvitationReviewPage = lazy(() => import('./pages/arrange/InvitationReviewPage').then((m) => ({ default: m.InvitationReviewPage })));
const InvitationSentPage = lazy(() => import('./pages/arrange/InvitationSentPage').then((m) => ({ default: m.InvitationSentPage })));
const RequestDetailPage = lazy(() => import('./pages/arrange/RequestDetailPage').then((m) => ({ default: m.RequestDetailPage })));
const SuggestChangesPage = lazy(() => import('./pages/arrange/SuggestChangesPage').then((m) => ({ default: m.SuggestChangesPage })));
const DeclinePage = lazy(() => import('./pages/arrange/DeclinePage').then((m) => ({ default: m.DeclinePage })));
const FixturesPage = lazy(() => import('./pages/arrange/FixturesPage').then((m) => ({ default: m.FixturesPage })));
const FixtureDetailPage = lazy(() => import('./pages/arrange/FixtureDetailPage').then((m) => ({ default: m.FixtureDetailPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/legal/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })));
const DeleteAccountInfoPage = lazy(() => import('./pages/legal/DeleteAccountInfoPage').then((m) => ({ default: m.DeleteAccountInfoPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>
        {/* Not gated: a verification link can legitimately be opened while already signed in. */}
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        {/* Public: Google Play links to these, signed in or not. */}
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/delete-account" element={<DeleteAccountInfoPage />} />

        <Route element={<ProtectedRoute />}>
          {/* Onboarding is a linear wizard with no team yet - it renders full-screen, outside the dashboard shell. */}
          <Route path="/email-verification" element={<EmailVerificationPage />} />
          <Route path="/role-selection" element={<RoleSelectionPage />} />
          <Route path="/select-club" element={<SelectClubPage />} />
          <Route path="/join-team" element={<JoinTeamPage />} />
          <Route path="/create-club" element={<CreateClubPage />} />
          <Route path="/create-team" element={<CreateTeamPage />} />
          <Route path="/add-venue" element={<AddVenuePage />} />
          <Route path="/add-availability" element={<AddAvailabilityPage />} />
          <Route path="/onboarding-complete" element={<OnboardingCompletePage />} />

          <Route element={<AppShellSwitch />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/team/:teamId" element={<TeamProfilePage />} />
            <Route path="/team/:teamId/edit" element={<EditTeamPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/report" element={<ReportBlockPage />} />
            <Route path="/venues" element={<VenuesListPage />} />
            <Route path="/venues/new" element={<EditVenuePage />} />
            <Route path="/venues/:venueId/edit" element={<EditVenuePage />} />
            <Route path="/club" element={<ClubProfilePage />} />
            <Route path="/club/:clubId/edit" element={<EditClubPage />} />
            {/* Members now live on Club & members (see ClubProfilePage) - kept as a redirect in case anything still links here. */}
            <Route path="/team/:teamId/members" element={<Navigate to="/club" replace />} />
            <Route path="/team/:teamId/verification" element={<VerificationPage />} />
            <Route path="/settings/notifications" element={<NotificationPreferencesPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/messages" element={<ConversationsListPage />} />
            <Route path="/messages/:conversationId" element={<ConversationThreadPage />} />
            <Route path="/settings/privacy" element={<PrivacyPage />} />
            <Route path="/settings/report" element={<AccountReportPage />} />
            <Route path="/settings/help" element={<HelpPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/calendar/:date" element={<DayDetailPage />} />
            <Route path="/availability/new" element={<EditAvailabilitySlotPage />} />
            <Route path="/availability/bulk" element={<BulkAddAvailabilityPage />} />
            <Route path="/availability/:slotId/edit" element={<EditAvailabilitySlotPage />} />
            <Route path="/search" element={<SuggestedMatchesPage />} />
            <Route path="/suggested-matches" element={<SuggestedMatchesPage />} />
            <Route path="/results" element={<ResultsListPage />} />
            <Route path="/opponent/:teamId" element={<OpponentProfilePage />} />
            <Route path="/match-explanation/:teamId" element={<MatchExplanationPage />} />
            <Route path="/invite/:teamId" element={<InvitationComposerPage />} />
            <Route path="/invite/review" element={<InvitationReviewPage />} />
            <Route path="/invite/sent/:requestId" element={<InvitationSentPage />} />
            <Route path="/request/:requestId" element={<RequestDetailPage />} />
            <Route path="/request/:requestId/suggest-changes" element={<SuggestChangesPage />} />
            <Route path="/request/:requestId/decline" element={<DeclinePage />} />
            <Route path="/fixtures" element={<FixturesPage />} />
            <Route path="/fixtures/:fixtureId" element={<FixtureDetailPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
