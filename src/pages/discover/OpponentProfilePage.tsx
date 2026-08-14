import { useState } from 'react';
import { Alert, Button, Chip, Container, Stack, Typography } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import { useNavigate, useParams } from 'react-router-dom';
import { useSearchResultsStore } from '../../session/SearchState';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { conversationRepository } from '../../api/conversationRepository';
import { PageHeader } from '../../components/PageHeader';

export function OpponentProfilePage() {
  const navigate = useNavigate();
  const { active } = useCurrentTeam();
  const { teamId } = useParams<{ teamId: string }>();
  const match = useSearchResultsStore((s) => (teamId ? s.findTeam(teamId) : null));
  const [opening, setOpening] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);

  if (!match) {
    return (
      <Container maxWidth="xs" sx={{ py: 6 }}>
        <Stack spacing={2}>
          <PageHeader title="Team profile" />
          <Typography>This opponent isn't in your last search results.</Typography>
        </Stack>
      </Container>
    );
  }

  const { team } = match;

  async function handleMessage() {
    if (!active) return;
    setOpening(true);
    setMessageError(null);
    const result = await conversationRepository.start(active.teamId, team.id);
    setOpening(false);
    if (result.ok) navigate(`/messages/${result.value.id}`);
    else setMessageError(result.message);
  }

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <PageHeader title={team.name} />
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

        {messageError && <Alert severity="error">{messageError}</Alert>}

        <Button variant="outlined" onClick={() => navigate(`/match-explanation/${team.id}`)}>
          Why this match?
        </Button>
        <Button
          variant="outlined"
          startIcon={<ChatBubbleOutlineIcon />}
          disabled={opening || !active}
          onClick={handleMessage}
        >
          {opening ? 'Opening…' : 'Message this team'}
        </Button>
        <Button variant="contained" size="large" onClick={() => navigate(`/invite/${team.id}`)}>
          Propose a friendly
        </Button>
        <Button
          variant="text"
          color="error"
          onClick={() => navigate(`/report?teamId=${team.id}&teamName=${encodeURIComponent(team.name)}`)}
        >
          Report or block
        </Button>
      </Stack>
    </Container>
  );
}
