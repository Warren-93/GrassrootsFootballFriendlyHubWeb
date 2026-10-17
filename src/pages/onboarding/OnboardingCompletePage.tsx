import { useEffect, useState } from 'react';
import { Box, Button, Card, CircularProgress, Container, Stack, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useNavigate } from 'react-router-dom';
import { useOnboardingTeam } from './useOnboardingTeam';
import { teamRepository } from '../../api/teamRepository';
import type { TeamView } from '../../api/types';
import { ProfileChecklistCard } from '../../components/ProfileChecklistCard';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { brand } from '../../theme/theme';

export function OnboardingCompletePage() {
  const navigate = useNavigate();
  const { teamId, loading: teamLoading } = useOnboardingTeam();
  const { setActive } = useCurrentTeam();
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<TeamView | null>(null);

  useEffect(() => {
    (async () => {
      if (teamLoading) return;
      if (!teamId) {
        setLoading(false);
        return;
      }
      const result = await teamRepository.get(teamId);
      if (result.ok) {
        setTeam(result.value);
        setActive({ teamId: result.value.id, teamName: result.value.name, clubId: result.value.clubId });
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, teamLoading]);

  if (loading) {
    return (
      <Container maxWidth="xs" sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  const stillNeeded = team?.readyForRequests === false;

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Card sx={{ p: 4, borderRadius: 4, mb: 2.5 }}>
        <Stack spacing={3} sx={{ alignItems: 'center', textAlign: 'center' }}>
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#E4F4E4',
              border: `3px solid ${brand.lime}`,
            }}
          >
            <CheckIcon sx={{ fontSize: 36, color: brand.pitchDeep }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {stillNeeded ? 'Your team is created' : "You're all set"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {stillNeeded
              ? "There's a little more to do before you can send and receive friendly requests. It's listed below and on your dashboard."
              : "Your team is ready. Head to your dashboard to review what's next."}
          </Typography>
          <Button variant="contained" size="large" fullWidth onClick={() => navigate('/')}>
            Go to dashboard
          </Button>
        </Stack>
      </Card>
      {team && <ProfileChecklistCard team={team} />}
    </Container>
  );
}
