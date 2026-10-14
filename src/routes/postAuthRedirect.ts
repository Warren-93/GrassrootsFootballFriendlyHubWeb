// Where PublicOnlyRoute sends a user the moment they become signed in. Sign-up
// sets this to onboarding: once the new session resolves, PublicOnlyRoute's
// redirect fires before RegisterPage's own navigate() could.
let pending: string | null = null;

export function setPostAuthRedirect(path: string | null) {
  pending = path;
}

export function takePostAuthRedirect(): string {
  const path = pending ?? '/';
  pending = null;
  return path;
}
