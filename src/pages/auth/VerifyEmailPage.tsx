import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authRepository } from '../../api/authRepository';
import { brand } from '../../theme/theme';

// SCR-AU-06's confirm-via-link step. Public (not behind ProtectedRoute) so
// the link works whether or not this browser still has a session - the
// token itself, not the caller's auth, is what proves ownership.
export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'checking' | 'success' | 'failure'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('failure');
      setErrorMessage('This link is missing its verification code.');
      return;
    }
    authRepository.confirmVerification(token).then((result) => {
      if (result.ok) setStatus('success');
      else {
        setStatus('failure');
        setErrorMessage(result.message);
      }
    });
  }, [token]);

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
          <Stack spacing={3} sx={{ alignItems: 'center', textAlign: 'center' }}>
            {status === 'checking' && (
              <>
                <CircularProgress />
                <Typography>Verifying your email…</Typography>
              </>
            )}
            {status === 'success' && (
              <>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Email verified
                </Typography>
                <Alert severity="success" sx={{ width: '100%' }}>
                  Your account is now fully set up.
                </Alert>
                <Button variant="contained" onClick={() => navigate('/')}>
                  Continue
                </Button>
              </>
            )}
            {status === 'failure' && (
              <>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Couldn't verify your email
                </Typography>
                <Alert severity="error" sx={{ width: '100%' }}>
                  {errorMessage}
                </Alert>
                <Button variant="outlined" onClick={() => navigate('/email-verification')}>
                  Back to verification
                </Button>
              </>
            )}
          </Stack>
        </Card>
      </Container>
    </Box>
  );
}
