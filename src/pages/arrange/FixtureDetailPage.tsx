import { useEffect, useState } from 'react';
import { Button, Chip, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { fixtureRepository } from '../../api/fixtureRepository';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import type { FixtureView } from '../../api/types';

export function FixtureDetailPage() {
  const navigate = useNavigate();
  const { active } = useCurrentTeam();
  const { fixtureId } = useParams<{ fixtureId: string }>();
  const [fixture, setFixture] = useState<FixtureView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fixtureId) return;
    fixtureRepository.get(fixtureId).then((result) => {
      if (result.ok) setFixture(result.value);
      setLoading(false);
    });
  }, [fixtureId]);

  if (loading) {
    return (
      <Container maxWidth="xs" sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!fixture) {
    return (
      <Container maxWidth="xs" sx={{ py: 6 }}>
        <Typography>Fixture not found.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Stack spacing={2}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {fixture.homeTeam.name} vs {fixture.awayTeam.name}
        </Typography>
        <Chip label={fixture.status} sx={{ alignSelf: 'flex-start' }} />

        <Typography variant="body2">
          {fixture.date}, kick-off {fixture.startTime.slice(0, 5)} - {fixture.endTime.slice(0, 5)}
        </Typography>
        <Typography variant="body2">Cost share: {fixture.costShare.replace(/_/g, ' ')}</Typography>
        <Typography variant="body2">Referee: {fixture.refereeArrangement.replace(/_/g, ' ')}</Typography>

        <Stack spacing={0.5}>
          <Typography variant="subtitle2">Home team contact</Typography>
          <Typography variant="body2">
            {fixture.homeTeam.managerName ?? '—'} {fixture.homeTeam.contactPhone ?? ''}
          </Typography>
        </Stack>
        <Stack spacing={0.5}>
          <Typography variant="subtitle2">Away team contact</Typography>
          <Typography variant="body2">
            {fixture.awayTeam.managerName ?? '—'} {fixture.awayTeam.contactPhone ?? ''}
          </Typography>
        </Stack>

        {active && (
          <Button
            variant="text"
            color="error"
            onClick={() => {
              const otherTeam = active.teamId === fixture.homeTeam.id ? fixture.awayTeam : fixture.homeTeam;
              navigate(`/report?teamId=${otherTeam.id}&teamName=${encodeURIComponent(otherTeam.name)}&fixtureId=${fixture.id}`);
            }}
          >
            Report or block
          </Button>
        )}
      </Stack>
    </Container>
  );
}
