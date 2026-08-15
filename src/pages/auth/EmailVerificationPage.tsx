import { useState } from 'react';
import { Alert, Box, Button, Card, Container, Link, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { authRepository } from '../../api/authRepository';
import { useAuth } from '../../auth/AuthContext';
import { PageHeader } from '../../components/PageHeader';
import { brand } from '../../theme/theme';

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
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        px: 2,
        py: 6,
        background: `radial-gradient(680px 260px at 88% -25%, rgba(111,199,138,.22), transparent 60%), linear-gradient(158deg, ${brand.void} 0%, ${brand.voidLight} 60%, ${brand.void} 130%)`,
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,.05) 0 1px, transparent 1px 72px)',
        },
      }}
    >
      <Container maxWidth="xs" sx={{ position: 'relative' }}>
        <Card sx={{ p: 4, borderRadius: 4, boxShadow: '0 24px 60px rgba(0,0,0,.35)' }}>
          <Stack spacing={3}>
            <PageHeader title="Verify your email" onBack={() => navigate('/')} />
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
        </Card>
      </Container>
    </Box>
  );
}
