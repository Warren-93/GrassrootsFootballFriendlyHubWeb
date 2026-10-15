import { useEffect, useRef, useState } from 'react';
import { Box, Button, Divider, Stack, Typography, useTheme } from '@mui/material';
import AppleIcon from '@mui/icons-material/Apple';
import type { OAuthSignInRequest } from '../api/types';
import { AppleSignInFailure, listenForGoogleIdToken, loadApple, prepareGoogle, signInWithApple } from '../auth/oauthSdk';
import { useOAuthSignIn } from '../auth/useOAuthSignIn';
import { useClientConfig } from '../session/ClientConfigState';

interface OAuthButtonsProps {
  /** The page's error alert: set to a message, or null to clear it. */
  onError: (message: string | null) => void;
}

/**
 * "Continue with Google" and "Continue with Apple" under an "or" divider, each
 * shown only when the API's config turns that provider on. Renders nothing
 * while the config loads, or when neither is on.
 */
export function OAuthButtons({ onError }: OAuthButtonsProps) {
  const { config } = useClientConfig();
  const { signIn, pending } = useOAuthSignIn(onError);

  const googleClientId = config?.google.enabled ? config.google.clientId : null;
  // Apple can be on for the iOS app alone, with no web Services ID - then there's no button here.
  const appleServicesId = config?.apple.enabled ? config.apple.servicesId : null;
  if (!googleClientId && !appleServicesId) return null;

  return (
    <Stack spacing={1.5}>
      <Divider>
        <Typography variant="body2" color="text.secondary">
          or
        </Typography>
      </Divider>
      {googleClientId && (
        <GoogleButton clientId={googleClientId} onIdToken={(idToken) => void signIn('google', { idToken })} />
      )}
      {appleServicesId && (
        <AppleButton
          servicesId={appleServicesId}
          disabled={pending}
          onError={onError}
          onSignedIn={(request) => void signIn('apple', request)}
        />
      )}
      {pending && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          Signing in…
        </Typography>
      )}
    </Stack>
  );
}

/** Google's own button (its brand rules don't allow a home-made one), drawn into this box by its SDK. */
function GoogleButton({ clientId, onIdToken }: { clientId: string; onIdToken: (idToken: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mode = useTheme().palette.mode;
  const [unavailable, setUnavailable] = useState(false);
  // Google calls back long after this render, so it reads the latest handler from a ref.
  const latestOnIdToken = useRef(onIdToken);
  useEffect(() => {
    latestOnIdToken.current = onIdToken;
  });

  useEffect(() => {
    let active = true;
    let stopListening: (() => void) | undefined;
    prepareGoogle(clientId)
      .then((google) => {
        const container = containerRef.current;
        if (!active || !container) return;
        stopListening = listenForGoogleIdToken((idToken) => latestOnIdToken.current(idToken));
        container.replaceChildren();
        google.accounts.id.renderButton(container, {
          type: 'standard',
          theme: mode === 'dark' ? 'filled_black' : 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'center',
          width: Math.min(400, container.clientWidth || 400),
          locale: 'en_GB',
        });
      })
      .catch(() => {
        if (active) setUnavailable(true);
      });
    return () => {
      active = false;
      stopListening?.();
    };
  }, [clientId, mode]);

  // Blocked by the browser or an extension: leave the other ways in rather than an empty gap.
  if (unavailable) return null;
  return <Box ref={containerRef} data-testid="google-sign-in" sx={{ display: 'flex', justifyContent: 'center', minHeight: 40 }} />;
}

interface AppleButtonProps {
  servicesId: string;
  disabled: boolean;
  onError: (message: string | null) => void;
  onSignedIn: (request: OAuthSignInRequest) => void;
}

function AppleButton({ servicesId, disabled, onError, onSignedIn }: AppleButtonProps) {
  const dark = useTheme().palette.mode === 'dark';
  const [open, setOpen] = useState(false);

  // Fetch Apple's SDK now so a click opens its window straight away - browsers block windows opened after a wait.
  useEffect(() => {
    loadApple().catch(() => {
      // Reported if the person clicks the button.
    });
  }, []);

  async function handleClick() {
    onError(null);
    setOpen(true);
    try {
      const request = await signInWithApple(servicesId);
      if (request) onSignedIn(request);
    } catch (error) {
      onError(error instanceof AppleSignInFailure ? error.message : "Apple sign-in didn't work - please try again.");
    } finally {
      setOpen(false);
    }
  }

  // Apple's guidelines: a black button on light backgrounds, a white one on dark.
  return (
    <Button
      variant="contained"
      size="large"
      startIcon={<AppleIcon />}
      disabled={disabled || open}
      onClick={handleClick}
      sx={{
        bgcolor: dark ? '#FFFFFF' : '#000000',
        color: dark ? '#000000' : '#FFFFFF',
        '&:hover': { bgcolor: dark ? '#E8E8ED' : '#1D1D1F' },
      }}
    >
      Continue with Apple
    </Button>
  );
}
