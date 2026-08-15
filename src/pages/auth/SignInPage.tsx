import { useState } from 'react';
import { Alert, Box, Button, Card, Container, Link, Stack, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { authRepository } from '../../api/authRepository';
import { useAuth } from '../../auth/AuthContext';
import { BrandHeader } from '../../components/BrandHeader';
import { brand } from '../../theme/theme';

export function SignInPage() {
  const navigate = useNavigate();
  const { resolveSession } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setErrorMessage(null);
    const result = await authRepository.login({ email, password });
    setSubmitting(false);
    if (result.ok) {
      await resolveSession();
      navigate('/');
    } else {
      setErrorMessage(result.message);
    }
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
                Sign in
              </Typography>
            </Stack>

            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
            />

            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

            <Button variant="contained" size="large" disabled={submitting || !email || !password} onClick={handleSubmit}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>

            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
              <Link component="button" variant="body2" onClick={() => navigate('/forgot-password', { state: { email } })}>
                Forgot password?
              </Link>
              <Link component="button" variant="body2" onClick={() => navigate('/register')}>
                Create account
              </Link>
            </Stack>
          </Stack>
        </Card>
      </Container>
    </Box>
  );
}
