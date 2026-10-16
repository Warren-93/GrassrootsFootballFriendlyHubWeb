// Finishes "Continue with Google/Apple": trades the provider's ID token for a
// Kickabout session through the same path as the password form (cookie mode,
// the in-memory access token, then AuthContext), and sends a brand-new account
// to onboarding like sign-up does - unless an invitation already put it on a
// team - and everyone else to the dashboard.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authRepository } from '../api/authRepository';
import { teamRepository } from '../api/teamRepository';
import type { OAuthProvider, OAuthSignInRequest } from '../api/types';
import { setPostAuthRedirect, takePostAuthRedirect } from '../routes/postAuthRedirect';
import { useAuth } from './AuthContext';

/** `onError` is the page's error alert: given the API's message on failure, and null when a new attempt starts. */
export function useOAuthSignIn(onError: (message: string | null) => void) {
  const navigate = useNavigate();
  const { resolveSession } = useAuth();
  const [pending, setPending] = useState(false);

  async function signIn(provider: OAuthProvider, request: OAuthSignInRequest) {
    setPending(true);
    onError(null);
    const result = await authRepository.oauthSignIn(provider, request);
    setPending(false);
    if (!result.ok) {
      onError(result.message);
      return;
    }
    // A new account can already be on a team: the API accepts any invitation
    // to that email as it creates the account. Only onboard it if it isn't.
    // Everyone else goes back to the page they were sent to sign in from, if any.
    const destination = result.value.newUser && !(await isOnATeam()) ? '/role-selection' : takePostAuthRedirect();
    // PublicOnlyRoute redirects the moment the session resolves, before navigate() below runs.
    setPostAuthRedirect(destination);
    await resolveSession();
    navigate(destination);
  }

  return { signIn, pending };
}

async function isOnATeam(): Promise<boolean> {
  const result = await teamRepository.listMine();
  return result.ok && result.value.length > 0;
}
