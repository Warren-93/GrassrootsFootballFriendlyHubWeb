import { useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, Container, Stack, Typography } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useNavigate, useParams } from 'react-router-dom';
import { useSearchResultsStore } from '../../session/SearchState';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { conversationRepository } from '../../api/conversationRepository';
import { PageHeader } from '../../components/PageHeader';
import { CrestAvatar } from '../../components/brand/CrestAvatar';
import { MatchScoreChip } from '../../components/brand/MatchScoreChip';
import { StatTile, StatTileRow } from '../../components/brand/StatTile';
import { brand } from '../../theme/theme';

export function OpponentProfilePage() {
  const navigate = useNavigate();
  const { active } = useCurrentTeam();
  const { teamId } = useParams<{ teamId: string }>();
  const match = useSearchResultsStore((s) => (teamId ? s.findTeam(teamId) : null));
  const [opening, setOpening] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);

  if (!match) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
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
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <PageHeader title="Team profile" />

        <Card variant="outlined">
          <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <CrestAvatar name={team.name} size={64} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {team.name}
                </Typography>
                {team.verified && (
                  <Chip
                    icon={<VerifiedIcon sx={{ fontSize: 16 }} />}
                    label="Verified"
                    size="small"
                    sx={{ bgcolor: '#E4F4E4', color: brand.pitchDeep }}
                  />
                )}
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {team.clubName} &middot; {team.generalArea} &middot; {match.milesApart.toFixed(1)} mi
              </Typography>
              <Box sx={{ mt: 1 }}>
                <MatchScoreChip score={match.score} />
              </Box>
            </Box>
          </CardContent>
        </Card>

        <StatTileRow>
          <StatTile label="Age group" value={team.ageGroup} />
          <StatTile label="Gender" value={team.gender} />
          <StatTile label="Format" value={team.format} />
          <StatTile label="Ability" value={team.abilityLevel} />
        </StatTileRow>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              About
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {team.description || 'No description provided.'}
            </Typography>
          </CardContent>
        </Card>

        {messageError && <Alert severity="error">{messageError}</Alert>}

        <Stack spacing={1.5}>
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
      </Stack>
    </Container>
  );
}
