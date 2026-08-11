import { Button, Chip, Container, Stack, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useSearchResultsStore } from '../../session/SearchState';

export function OpponentProfilePage() {
  const navigate = useNavigate();
  const { teamId } = useParams<{ teamId: string }>();
  const match = useSearchResultsStore((s) => (teamId ? s.findTeam(teamId) : null));

  if (!match) {
    return (
      <Container maxWidth="xs" sx={{ py: 6 }}>
        <Typography>This opponent isn't in your last search results.</Typography>
      </Container>
    );
  }

  const { team } = match;

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {team.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {team.clubName} · {team.generalArea}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
          <Chip label={team.ageGroup} />
          <Chip label={team.gender} />
          <Chip label={team.format} />
          <Chip label={team.abilityLevel} />
          {team.verified && <Chip label="Verified" color="success" />}
        </Stack>

        {team.description && <Typography variant="body2">{team.description}</Typography>}

        <Typography variant="body2" color="text.secondary">
          {match.score}% match · {match.milesApart.toFixed(1)} miles away
        </Typography>

        <Button variant="outlined" onClick={() => navigate(`/match-explanation/${team.id}`)}>
          Why this match?
        </Button>
        <Button variant="contained" size="large" onClick={() => navigate(`/invite/${team.id}`)}>
          Propose a friendly
        </Button>
      </Stack>
    </Container>
  );
}
