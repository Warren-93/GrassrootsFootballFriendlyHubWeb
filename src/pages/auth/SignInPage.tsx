import { useState } from 'react';
import { Alert, Button, Container, Link, Stack, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { authRepository } from '../../api/authRepository';
import { useAuth } from '../../auth/AuthContext';
import { BrandHeader } from '../../components/BrandHeader';

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
    <Container maxWidth="xs" sx={{ py: 6 }}>
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
    </Container>
  );
}
