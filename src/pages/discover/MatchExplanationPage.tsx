import { Box, Container, LinearProgress, Stack, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useSearchResultsStore } from '../../session/SearchState';

export function MatchExplanationPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const match = useSearchResultsStore((s) => (teamId ? s.findTeam(teamId) : null));

  if (!match) {
    return (
      <Container maxWidth="xs" sx={{ py: 6 }}>
        <Typography>This opponent isn't in your last search results.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Why {match.team.name}?
        </Typography>
        <Typography variant="h3" color="primary">
          {match.score}%
        </Typography>

        {match.factors.map((factor) => (
          <Box key={factor.factor}>
            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {factor.label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {factor.weight}% weight
              </Typography>
            </Stack>
            <LinearProgress variant="determinate" value={factor.ratio * 100} sx={{ my: 0.5 }} />
            <Typography variant="caption" color="text.secondary">
              {factor.reason}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Container>
  );
}
