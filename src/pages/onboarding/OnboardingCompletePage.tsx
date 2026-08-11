import { useEffect, useState } from 'react';
import { Button, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { teamRepository } from '../../api/teamRepository';
import { useCurrentTeam } from '../../session/CurrentTeamContext';

export function OnboardingCompletePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { teamId } = (location.state as { teamId: string }) ?? {};
  const { setActive } = useCurrentTeam();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!teamId) {
        setLoading(false);
        return;
      }
      const result = await teamRepository.get(teamId);
      if (result.ok) {
        setActive({ teamId: result.value.id, teamName: result.value.name, clubId: result.value.clubId });
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  if (loading) {
    return (
      <Container maxWidth="xs" sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          You're all set
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Your team is ready. Head to your dashboard to review what's next.
        </Typography>
        <Button variant="contained" size="large" onClick={() => navigate('/')}>
          Go to dashboard
        </Button>
      </Stack>
    </Container>
  );
}
