import { useState } from 'react';
import { Alert, Button, Container, Link, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { authRepository } from '../../api/authRepository';
import { useAuth } from '../../auth/AuthContext';

// SCR-AU-06. No foreground-resume polling wired up (needs a platform
// lifecycle hook this SPA doesn't have) - "Check now" covers the same need
// explicitly, same simplification as mobile.
export function EmailVerificationPage() {
  const navigate = useNavigate();
  const { session, resolveSession } = useAuth();
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [verifyLink, setVerifyLink] = useState<string | null>(null);

  async function resend() {
    setResending(true);
    setMessage(null);
    setVerifyLink(null);
    const result = await authRepository.resendVerification();
    setResending(false);
    if (!result.ok) {
      setMessage(result.message);
    } else if (result.value.verificationToken) {
      setVerifyLink(`/verify-email?token=${encodeURIComponent(result.value.verificationToken)}`);
    } else {
      setMessage('This account is already verified.');
    }
  }

  async function checkNow() {
    setChecking(true);
    await resolveSession();
    setChecking(false);
    if (session?.emailVerified) navigate('/');
  }

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Verify your email
        </Typography>
        <Typography variant="body2" color="text.secondary">
          We've sent a verification link to {session?.email}. Follow it, then check back here.
        </Typography>

        {message && <Alert severity="info">{message}</Alert>}
        {verifyLink && (
          <Alert severity="warning">
            No email provider is connected yet, so we can't send this automatically. Use this link to verify your
            account now instead:{' '}
            <Link component="button" onClick={() => navigate(verifyLink)}>
              Verify now
            </Link>
          </Alert>
        )}

        <Button variant="contained" size="large" disabled={checking} onClick={checkNow}>
          {checking ? 'Checking…' : 'Check now'}
        </Button>
        <Button variant="text" disabled={resending} onClick={resend}>
          {resending ? 'Sending…' : 'Resend email'}
        </Button>
      </Stack>
    </Container>
  );
}
