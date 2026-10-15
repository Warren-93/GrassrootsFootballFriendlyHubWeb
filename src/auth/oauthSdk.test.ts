import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppleSignInFailure, GOOGLE_SDK_URL, listenForGoogleIdToken, prepareGoogle, signInWithApple } from './oauthSdk';
import type { AppleSignInResponse, GoogleIdConfiguration } from './oauthGlobals';

function stubApple(signIn: () => Promise<AppleSignInResponse>) {
  const init = vi.fn();
  window.AppleID = { auth: { init, signIn } };
  return init;
}

describe('signInWithApple', () => {
  afterEach(() => {
    delete window.AppleID;
  });

  it('opens Apple in a popup and returns the ID token with the name Apple shared', async () => {
    const init = stubApple(async () => ({
      authorization: { code: 'code', id_token: 'apple-id-token' },
      user: { email: 'sam@privaterelay.appleid.com', name: { firstName: 'Sam', lastName: 'Coach' } },
    }));

    await expect(signInWithApple('com.kickabout.web')).resolves.toEqual({
      idToken: 'apple-id-token',
      displayName: 'Sam Coach',
    });
    expect(init).toHaveBeenCalledWith({
      clientId: 'com.kickabout.web',
      scope: 'name email',
      redirectURI: `${window.location.origin}/sign-in`,
      usePopup: true,
    });
  });

  it('sends no name on later sign-ins, when Apple leaves it out', async () => {
    stubApple(async () => ({ authorization: { code: 'code', id_token: 'apple-id-token' } }));

    await expect(signInWithApple('com.kickabout.web')).resolves.toEqual({ idToken: 'apple-id-token' });
  });

  it('returns null when the person closes the Apple window', async () => {
    stubApple(() => Promise.reject({ error: 'popup_closed_by_user' }));

    await expect(signInWithApple('com.kickabout.web')).resolves.toBeNull();
  });

  it('explains a blocked popup', async () => {
    stubApple(() => Promise.reject({ error: 'popup_blocked_by_browser' }));

    const failure = signInWithApple('com.kickabout.web');

    await expect(failure).rejects.toBeInstanceOf(AppleSignInFailure);
    await expect(failure).rejects.toThrow(/allow pop-ups/);
  });
});

describe('prepareGoogle', () => {
  afterEach(() => {
    delete window.google;
  });

  it('loads the SDK once, initialises once, and sends each credential to the current listener', async () => {
    const initialize = vi.fn();
    const first = prepareGoogle('abc.apps.googleusercontent.com');
    const script = document.head.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_SDK_URL}"]`);
    expect(script).not.toBeNull();
    window.google = { accounts: { id: { initialize, renderButton: vi.fn() } } };
    script!.dispatchEvent(new Event('load'));
    await first;
    await prepareGoogle('abc.apps.googleusercontent.com');

    expect(document.head.querySelectorAll(`script[src="${GOOGLE_SDK_URL}"]`)).toHaveLength(1);
    expect(initialize).toHaveBeenCalledTimes(1);
    const { client_id, callback } = initialize.mock.calls[0][0] as GoogleIdConfiguration;
    expect(client_id).toBe('abc.apps.googleusercontent.com');

    const signInScreen = vi.fn();
    const stop = listenForGoogleIdToken(signInScreen);
    callback({ credential: 'google-id-token' });
    expect(signInScreen).toHaveBeenCalledWith('google-id-token');

    stop();
    callback({ credential: 'another-token' });
    expect(signInScreen).toHaveBeenCalledTimes(1);
  });
});
