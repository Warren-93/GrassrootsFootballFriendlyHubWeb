import { useState } from 'react';
import { Alert, Box, Button, Card, Container, Stack, TextField, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { authRepository } from '../../api/authRepository';
import { BrandHeader } from '../../components/BrandHeader';
import { brand } from '../../theme/theme';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefilled = (location.state as { email?: string } | null)?.email ?? '';
  const [email, setEmail] = useState(prefilled);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setErrorMessage(null);
    const result = await authRepository.requestPasswordReset(email);
    setSubmitting(false);
    if (result.ok) setSent(true);
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
                Reset your password
              </Typography>
            </Stack>

            {sent ? (
              <>
                <Alert severity="success">
                  If an account exists for {email}, we've sent password reset instructions.
                </Alert>
                <Button variant="outlined" onClick={() => navigate('/sign-in')}>
                  Back to sign in
                </Button>
              </>
            ) : (
              <>
                <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
                {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
                <Button variant="contained" size="large" disabled={submitting || !email} onClick={handleSubmit}>
                  {submitting ? 'Sending…' : 'Send reset instructions'}
                </Button>
              </>
            )}
          </Stack>
        </Card>
      </Container>
    </Box>
  );
}
