// Google Identity Services and Sign in with Apple JS are plain <script>s that
// each put one global on window (oauthSdk.ts loads them on demand). Only the
// parts Kickabout calls are declared here.

export interface GoogleCredentialResponse {
  /** The Google ID token (a JWT) - what the API verifies. */
  credential: string;
  select_by?: string;
}

export interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  ux_mode?: 'popup' | 'redirect';
  context?: 'signin' | 'signup' | 'use';
  auto_select?: boolean;
}

export interface GoogleButtonConfiguration {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  /** In pixels, 200 to 400. */
  width?: number;
  locale?: string;
}

export interface GoogleIdentityServices {
  accounts: {
    id: {
      initialize: (config: GoogleIdConfiguration) => void;
      renderButton: (parent: HTMLElement, options: GoogleButtonConfiguration) => void;
    };
  };
}

export interface AppleIdInitConfiguration {
  clientId: string;
  scope?: string;
  redirectURI: string;
  state?: string;
  nonce?: string;
  usePopup?: boolean;
}

export interface AppleSignInResponse {
  authorization: { code: string; id_token: string; state?: string };
  /** Only on the person's first sign-in to this app, and never again. */
  user?: { email?: string; name?: { firstName?: string; lastName?: string } };
}

/** What AppleID.auth.signIn() rejects with, e.g. { error: 'popup_closed_by_user' }. */
export interface AppleSignInError {
  error: string;
}

export interface AppleIdJs {
  auth: {
    init: (config: AppleIdInitConfiguration) => void;
    signIn: () => Promise<AppleSignInResponse>;
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityServices;
    AppleID?: AppleIdJs;
  }
}
