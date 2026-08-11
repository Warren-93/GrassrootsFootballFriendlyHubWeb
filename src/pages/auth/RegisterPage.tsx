import { useState } from 'react';
import { Alert, Button, Container, Link, Stack, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { authRepository } from '../../api/authRepository';
import { useAuth } from '../../auth/AuthContext';

export function RegisterPage() {
  const navigate = useNavigate();
  const { resolveSession } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const passwordTooShort = password.length > 0 && password.length < 10;

  async function handleSubmit() {
    setSubmitting(true);
    setErrorMessage(null);
    const result = await authRepository.register({ email, password, displayName });
    setSubmitting(false);
    if (result.ok) {
      await resolveSession();
      navigate('/role-selection');
    } else {
      setErrorMessage(result.message);
    }
  }

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Create your account
        </Typography>

        <TextField label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} fullWidth />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={passwordTooShort}
          helperText={passwordTooShort ? 'At least 10 characters' : ' '}
          fullWidth
        />

        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        <Button
          variant="contained"
          size="large"
          disabled={submitting || !email || password.length < 10 || !displayName}
          onClick={handleSubmit}
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>

        <Typography variant="body2" sx={{ textAlign: 'center' }}>
          Already have an account?{' '}
          <Link component="button" onClick={() => navigate('/sign-in')}>
            Sign in
          </Link>
        </Typography>
      </Stack>
    </Container>
  );
}
