import { useEffect, useState } from 'react';
import { Box, Button, Chip, CircularProgress, Container, LinearProgress, Stack, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { teamRepository } from '../../api/teamRepository';
import type { TeamView } from '../../api/types';

export function TeamProfilePage() {
  const navigate = useNavigate();
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<TeamView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) return;
    teamRepository.get(teamId).then((result) => {
      if (result.ok) setTeam(result.value);
      setLoading(false);
    });
  }, [teamId]);

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!team) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Typography>Team not found.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {team.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {team.clubName}
          </Typography>
        </Box>

        <Box>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            Profile {team.completenessPercent}% complete
          </Typography>
          <LinearProgress variant="determinate" value={team.completenessPercent} />
        </Box>

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
          <Chip label={team.ageGroup} />
          <Chip label={team.gender} />
          <Chip label={team.format} />
          <Chip label={team.abilityLevel} />
          <Chip label={team.verification} color={team.verification === 'VERIFIED' ? 'success' : 'default'} />
        </Stack>

        {team.description && <Typography variant="body2">{team.description}</Typography>}

        <Stack spacing={0.5}>
          <Typography variant="body2" color="text.secondary">
            {team.postcode} · travels up to {team.travelRadiusMiles} miles · prefers {team.homeAwayPreference}
          </Typography>
          {team.league && (
            <Typography variant="body2" color="text.secondary">
              League: {team.league}
            </Typography>
          )}
          {team.managerName && (
            <Typography variant="body2" color="text.secondary">
              Manager: {team.managerName} {team.contactPhone ? `· ${team.contactPhone}` : ''}
            </Typography>
          )}
        </Stack>

        <Button variant="contained" onClick={() => navigate(`/team/${team.id}/edit`)}>
          Edit team
        </Button>
      </Stack>
    </Container>
  );
}
