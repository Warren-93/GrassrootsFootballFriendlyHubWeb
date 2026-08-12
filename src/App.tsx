import { Navigate, Route, Routes } from 'react-router-dom';
import { WelcomePage } from './pages/auth/WelcomePage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { SignInPage } from './pages/auth/SignInPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { EmailVerificationPage } from './pages/auth/EmailVerificationPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { RoleSelectionPage } from './pages/onboarding/RoleSelectionPage';
import { CreateClubPage } from './pages/onboarding/CreateClubPage';
import { CreateTeamPage } from './pages/onboarding/CreateTeamPage';
import { AddVenuePage } from './pages/onboarding/AddVenuePage';
import { AddAvailabilityPage } from './pages/onboarding/AddAvailabilityPage';
import { OnboardingCompletePage } from './pages/onboarding/OnboardingCompletePage';
import { TeamProfilePage } from './pages/profile/TeamProfilePage';
import { EditTeamPage } from './pages/profile/EditTeamPage';
import { SettingsPage } from './pages/profile/SettingsPage';
import { HomePage } from './pages/Home/HomePage';
import { CalendarPage } from './pages/availability/CalendarPage';
import { DayDetailPage } from './pages/availability/DayDetailPage';
import { EditAvailabilitySlotPage } from './pages/availability/EditAvailabilitySlotPage';
import { SearchEntryPage } from './pages/discover/SearchEntryPage';
import { FiltersPage } from './pages/discover/FiltersPage';
import { ResultsListPage } from './pages/discover/ResultsListPage';
import { OpponentProfilePage } from './pages/discover/OpponentProfilePage';
import { MatchExplanationPage } from './pages/discover/MatchExplanationPage';
import { InvitationComposerPage } from './pages/arrange/InvitationComposerPage';
import { InvitationReviewPage } from './pages/arrange/InvitationReviewPage';
import { InvitationSentPage } from './pages/arrange/InvitationSentPage';
import { RequestDetailPage } from './pages/arrange/RequestDetailPage';
import { SuggestChangesPage } from './pages/arrange/SuggestChangesPage';
import { DeclinePage } from './pages/arrange/DeclinePage';
import { FixturesPage } from './pages/arrange/FixturesPage';
import { FixtureDetailPage } from './pages/arrange/FixtureDetailPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { PlaceholderPage } from './pages/PlaceholderPage';

function App() {
  return (
    <Routes>
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/email-verification" element={<EmailVerificationPage />} />
        <Route path="/role-selection" element={<RoleSelectionPage />} />
        <Route path="/create-club" element={<CreateClubPage />} />
        <Route path="/create-team" element={<CreateTeamPage />} />
        <Route path="/add-venue" element={<AddVenuePage />} />
        <Route path="/add-availability" element={<AddAvailabilityPage />} />
        <Route path="/onboarding-complete" element={<OnboardingCompletePage />} />
        <Route path="/team/:teamId" element={<TeamProfilePage />} />
        <Route path="/team/:teamId/edit" element={<EditTeamPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/notifications" element={<PlaceholderPage label="Notification preferences" />} />
        <Route path="/settings/privacy" element={<PlaceholderPage label="Privacy and data" />} />
        <Route path="/settings/help" element={<PlaceholderPage label="Help and support" />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/calendar/:date" element={<DayDetailPage />} />
        <Route path="/availability/new" element={<EditAvailabilitySlotPage />} />
        <Route path="/availability/:slotId/edit" element={<EditAvailabilitySlotPage />} />
        <Route path="/search" element={<SearchEntryPage />} />
        <Route path="/filters" element={<FiltersPage />} />
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
        <Route path="*" element={<PlaceholderPage label="Not built yet" />} />
      </Route>

      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  );
}

export default App;
