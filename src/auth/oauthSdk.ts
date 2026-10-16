// Google's and Apple's sign-in SDKs, fetched only when a sign-in screen shows
// their button, so most visits never download either. Each script loads once
// per page; a failed load is forgotten so the next screen tries again.
import type { OAuthSignInRequest } from '../api/types';
import type { AppleIdJs, AppleSignInError, GoogleIdentityServices } from './oauthGlobals';

export const GOOGLE_SDK_URL = 'https://accounts.google.com/gsi/client';
export const APPLE_SDK_URL = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';

const scripts = new Map<string, Promise<void>>();

function loadScript(src: string): Promise<void> {
  const existing = scripts.get(src);
  if (existing) return existing;
  const loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scripts.delete(src);
      script.remove();
      reject(new Error(`Couldn't load ${src}`));
    };
    document.head.appendChild(script);
  });
  scripts.set(src, loading);
  return loading;
}

async function loadGoogle(): Promise<GoogleIdentityServices> {
  await loadScript(GOOGLE_SDK_URL);
  if (!window.google?.accounts?.id) throw new Error('Google sign-in did not load');
  return window.google;
}

export async function loadApple(): Promise<AppleIdJs> {
  await loadScript(APPLE_SDK_URL);
  if (!window.AppleID?.auth) throw new Error('Apple sign-in did not load');
  return window.AppleID;
}

// Google wants initialize() called once per page, but its button shows on
// three screens with their own handlers - so initialise once per client ID and
// pass each credential to whichever screen is listening.
let googleClientId: string | null = null;
let googleListener: ((idToken: string) => void) | null = null;

/** Loads Google's SDK, initialised for `clientId`, ready to render a button. */
export async function prepareGoogle(clientId: string): Promise<GoogleIdentityServices> {
  const google = await loadGoogle();
  if (googleClientId !== clientId) {
    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => googleListener?.(response.credential),
      ux_mode: 'popup',
    });
    googleClientId = clientId;
  }
  return google;
}

/** Sends each Google ID token to `listener` until the returned function is called. */
export function listenForGoogleIdToken(listener: (idToken: string) => void): () => void {
  googleListener = listener;
  return () => {
    if (googleListener === listener) googleListener = null;
  };
}

// Closing Apple's window isn't a failure worth an error message.
const APPLE_CANCELLED = new Set(['popup_closed_by_user', 'user_cancelled_authorize']);

/** A failed Apple sign-in, with a message fit for the page's error alert. */
export class AppleSignInFailure extends Error {}

/**
 * Opens Apple's sign-in window. Resolves to the request for the API, or null
 * when the person closed the window; throws AppleSignInFailure otherwise.
 * Call it straight from a click so the browser allows the window: the SDK is
 * normally loaded already, as the Apple button preloads it.
 */
export async function signInWithApple(servicesId: string): Promise<OAuthSignInRequest | null> {
  let appleId: AppleIdJs;
  try {
    appleId = window.AppleID ?? (await loadApple());
  } catch {
    throw new AppleSignInFailure("Couldn't reach Apple - check your connection and try again.");
  }

  appleId.auth.init({
    clientId: servicesId,
    scope: 'name email',
    redirectURI: `${window.location.origin}/sign-in`,
    usePopup: true,
  });

  try {
    const { authorization, user } = await appleId.auth.signIn();
    // Apple only shares the name on the first sign-in, and only here - its ID token never carries it.
    const displayName = [user?.name?.firstName, user?.name?.lastName].filter(Boolean).join(' ').trim();
    return displayName ? { idToken: authorization.id_token, displayName } : { idToken: authorization.id_token };
  } catch (error) {
    const code = (error as Partial<AppleSignInError> | undefined)?.error;
    if (code && APPLE_CANCELLED.has(code)) return null;
    if (code === 'popup_blocked_by_browser') {
      throw new AppleSignInFailure('Your browser blocked the Apple sign-in window - allow pop-ups for this site and try again.');
    }
    throw new AppleSignInFailure("Apple sign-in didn't work - please try again.");
  }
}
