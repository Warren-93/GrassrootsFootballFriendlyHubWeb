import { useEffect, useState } from 'react';
import { Alert, Button, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authRepository } from '../../api/authRepository';

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
    <Container maxWidth="xs" sx={{ py: 6 }}>
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
    </Container>
  );
}
