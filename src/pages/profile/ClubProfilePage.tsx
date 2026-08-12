import { useEffect, useState } from 'react';
import { Alert, Avatar, Button, Card, CardActionArea, CardContent, Chip, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { clubRepository } from '../../api/clubRepository';
import { teamRepository } from '../../api/teamRepository';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import type { ClubView, TeamView } from '../../api/types';

// SCR-PR-03 Club profile. Purpose: manage club identity and the squads beneath it.
export function ClubProfilePage() {
  const navigate = useNavigate();
  const { active, setActive } = useCurrentTeam();
  const [club, setClub] = useState<ClubView | null>(null);
  const [teams, setTeams] = useState<TeamView[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    Promise.all([clubRepository.get(active.clubId), teamRepository.listByClub(active.clubId)]).then(
      ([clubResult, teamsResult]) => {
        if (clubResult.ok) setClub(clubResult.value);
        else setErrorMessage(clubResult.message);
        if (teamsResult.ok) setTeams(teamsResult.value);
        setLoading(false);
      },
    );
  }, [active?.clubId]);

  if (!active) {
    return (
      <Container maxWidth="xs" sx={{ py: 6 }}>
        <Typography>No club selected.</Typography>
      </Container>
    );
  }
  if (loading) {
    return (
      <Container maxWidth="xs" sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  if (!club) {
    return (
      <Container maxWidth="xs" sx={{ py: 6 }}>
        <Alert severity="error">{errorMessage ?? 'Club not found.'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Stack spacing={2.5}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Avatar src={club.badgeUrl ?? undefined} sx={{ width: 56, height: 56 }}>
            {club.name[0]}
          </Avatar>
          <Stack>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {club.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {club.postcode}
            </Typography>
          </Stack>
        </Stack>

        <Typography variant="subtitle2">Teams</Typography>
        <Stack spacing={1}>
          {teams.map((t) => (
            <Card key={t.id} variant="outlined">
              <CardActionArea
                onClick={() => setActive({ teamId: t.id, teamName: t.name, clubId: t.clubId })}
                sx={{ p: 1.5 }}
              >
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Stack>
                    <Typography sx={{ fontWeight: 600 }}>{t.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t.ageGroup} · {t.format} · {t.completenessPercent}% complete
                    </Typography>
                  </Stack>
                  {t.id === active.teamId && <Chip label="Active" size="small" color="primary" />}
                </Stack>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
        <Button variant="outlined" onClick={() => navigate('/create-team', { state: { clubId: club.id, clubName: club.name } })}>
          Add team
        </Button>

        <Card variant="outlined">
          <CardActionArea onClick={() => navigate(`/team/${active.teamId}/members`)}>
            <CardContent>
              <Typography>Officials</Typography>
            </CardContent>
          </CardActionArea>
        </Card>
        <Card variant="outlined">
          <CardActionArea onClick={() => navigate('/venues')}>
            <CardContent>
              <Typography>Venues</Typography>
              <Typography variant="body2" color="text.secondary">
                Shared across all squads in this club
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>

        <Button variant="contained" onClick={() => navigate(`/club/${club.id}/edit`)}>
          Edit club
        </Button>
      </Stack>
    </Container>
  );
}
