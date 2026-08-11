import { useState } from 'react';
import { Alert, Button, Container, Stack, TextField, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { authRepository } from '../../api/authRepository';

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
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Reset your password
        </Typography>

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
    </Container>
  );
}
