import { useEffect, useState } from 'react';
import { Button, Card, CardContent, Chip, CircularProgress, Container, LinearProgress, Link, Stack, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { teamRepository } from '../../api/teamRepository';
import type { TeamView } from '../../api/types';
import { HeroBand } from '../../components/brand/HeroBand';

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
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <HeroBand
        compact
        eyebrow={
          <Link
            component="button"
            onClick={() => navigate('/club')}
            sx={{ color: 'inherit', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 700 }}
          >
            {team.clubName}
          </Link>
        }
        title={team.name}
      />

      <Stack spacing={3}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 700 }}>
              Profile {team.completenessPercent}% complete
            </Typography>
            <LinearProgress variant="determinate" value={team.completenessPercent} sx={{ borderRadius: 4, height: 8 }} />
          </CardContent>
        </Card>

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
          <Chip label={team.ageGroup} />
          <Chip label={team.gender} />
          <Chip label={team.format} />
          <Chip label={team.abilityLevel} />
          <Chip label={team.verification} color={team.verification === 'VERIFIED' ? 'success' : 'default'} />
        </Stack>

        <Card variant="outlined">
          <CardContent>
            {team.description && (
              <Typography variant="body2" sx={{ mb: 1.5 }}>
                {team.description}
              </Typography>
            )}
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
          </CardContent>
        </Card>

        <Stack spacing={1.5}>
          <Button variant="contained" onClick={() => navigate(`/team/${team.id}/edit`)}>
            Edit team
          </Button>
          <Button variant="outlined" onClick={() => navigate(`/team/${team.id}/members`)}>
            Officials
          </Button>
          <Button variant="outlined" onClick={() => navigate(`/team/${team.id}/verification`)}>
            Verification
          </Button>
          <Button variant="outlined" onClick={() => navigate('/venues')}>
            Venues
          </Button>
          <Button variant="outlined" onClick={() => navigate('/settings')}>
            Settings
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
