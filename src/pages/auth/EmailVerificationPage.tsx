import { useState } from 'react';
import { Alert, Button, Container, Stack, Typography } from '@mui/material';
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

  async function resend() {
    setResending(true);
    setMessage(null);
    const result = await authRepository.resendVerification();
    setResending(false);
    setMessage(result.ok ? 'Verification email sent.' : result.message);
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
