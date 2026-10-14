import { useState } from 'react';
import { Alert, Box, Button, Card, Container, Stack, TextField, Typography } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authRepository } from '../../api/authRepository';
import { BrandHeader } from '../../components/BrandHeader';
import { brand } from '../../theme/theme';

// SCR-AU-05's second half: where the emailed reset link lands. Public, like
// /verify-email - the token in the link is what proves ownership.
const MIN_PASSWORD_LENGTH = 10;

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    token ? null : 'This link is missing its reset code. Ask for a new one.',
  );

  const tooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
  const mismatch = confirm.length > 0 && confirm !== password;

  async function handleSubmit() {
    if (!token) return;
    setSubmitting(true);
    setErrorMessage(null);
    const result = await authRepository.confirmPasswordReset(token, password);
    setSubmitting(false);
    if (result.ok) setDone(true);
    else setErrorMessage(result.message);
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
            <Stack spacing={2} sx={{ mb: 1 }}>
              <BrandHeader tagline="none" />
              <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center' }}>
                Choose a new password
              </Typography>
            </Stack>

            {done ? (
              <>
                <Alert severity="success">Your password has been changed. Sign in with your new password.</Alert>
                <Button variant="contained" onClick={() => navigate('/sign-in')}>
                  Sign in
                </Button>
              </>
            ) : (
              <>
                <TextField
                  label="New password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={tooShort}
                  helperText={`At least ${MIN_PASSWORD_LENGTH} characters`}
                  disabled={!token}
                  fullWidth
                />
                <TextField
                  label="Confirm new password"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  error={mismatch}
                  helperText={mismatch ? "Passwords don't match" : ' '}
                  disabled={!token}
                  fullWidth
                />
                {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
                <Button
                  variant="contained"
                  size="large"
                  disabled={!token || submitting || password.length < MIN_PASSWORD_LENGTH || confirm !== password}
                  onClick={handleSubmit}
                >
                  {submitting ? 'Saving…' : 'Change password'}
                </Button>
                <Button variant="text" onClick={() => navigate('/forgot-password')}>
                  Ask for a new link
                </Button>
              </>
            )}
          </Stack>
        </Card>
      </Container>
    </Box>
  );
}
