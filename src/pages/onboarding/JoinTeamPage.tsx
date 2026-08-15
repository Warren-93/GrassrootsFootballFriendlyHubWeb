import { useState } from 'react';
import { Alert, Box, Button, Card, Container, Stack, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { memberRepository } from '../../api/memberRepository';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { PageHeader } from '../../components/PageHeader';
import { OnboardingStepper } from '../../components/brand/OnboardingStepper';

/** Self-service alternative to the create-club/create-team flow - redeem a manager's join code directly. */
export function JoinTeamPage() {
  const navigate = useNavigate();
  const { setActive } = useCurrentTeam();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setErrorMessage(null);
    const result = await memberRepository.join(code.trim());
    setSubmitting(false);
    if (result.ok) {
      setActive({ teamId: result.value.teamId, teamName: result.value.teamName, clubId: result.value.clubId });
      navigate('/');
    } else {
      setErrorMessage(result.message);
    }
  }

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Box sx={{ mb: 3 }}>
        <OnboardingStepper currentStep={1} />
      </Box>
      <Card sx={{ p: 4, borderRadius: 4 }}>
        <Stack spacing={3}>
          <PageHeader title="Join a team" />
          <Typography variant="body2" color="text.secondary">
            Enter the code your team manager shared with you.
          </Typography>

          <TextField
            label="Join code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            fullWidth
            slotProps={{ htmlInput: { maxLength: 6, style: { letterSpacing: '0.2em', textTransform: 'uppercase' } } }}
          />

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          <Button variant="contained" size="large" disabled={submitting || code.trim().length !== 6} onClick={handleSubmit}>
            {submitting ? 'Joining…' : 'Join team'}
          </Button>
        </Stack>
      </Card>
    </Container>
  );
}
