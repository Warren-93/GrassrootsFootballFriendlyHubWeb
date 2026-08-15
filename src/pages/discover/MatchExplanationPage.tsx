import { Box, Card, CardContent, Container, LinearProgress, Stack, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useSearchResultsStore } from '../../session/SearchState';
import { PageHeader } from '../../components/PageHeader';
import { MatchScoreChip } from '../../components/brand/MatchScoreChip';
import { brand } from '../../theme/theme';

export function MatchExplanationPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const match = useSearchResultsStore((s) => (teamId ? s.findTeam(teamId) : null));

  if (!match) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Stack spacing={2}>
          <PageHeader title="Match explanation" />
          <Typography>This opponent isn't in your last search results.</Typography>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <PageHeader title={`Why ${match.team.name}?`} />

        <Box sx={{ textAlign: 'center', py: 1 }}>
          <Typography
            sx={{
              fontFamily: '"Bebas Neue","Inter",sans-serif',
              fontSize: 'clamp(48px,10vw,72px)',
              lineHeight: 0.96,
              color: brand.pitchDeep,
            }}
          >
            {match.score}%
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
            <MatchScoreChip score={match.score} />
          </Box>
        </Box>

        <Stack spacing={2}>
          {match.factors.map((factor) => (
            <Card variant="outlined" key={factor.factor}>
              <CardContent>
                <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {factor.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {factor.weight}% weight
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={factor.ratio * 100}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: brand.mist,
                    '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: brand.pitch },
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
                  {factor.reason}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Container>
  );
}
