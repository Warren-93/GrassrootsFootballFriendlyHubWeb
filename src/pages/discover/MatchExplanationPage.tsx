import { Box, Card, CardContent, Container, Stack, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useSearchResultsStore } from '../../session/SearchState';
import { brand } from '../../theme/theme';

export function MatchExplanationPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const match = useSearchResultsStore((s) => (teamId ? s.findTeam(teamId) : null));

  if (!match) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography>This opponent isn't in your last search results.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Card variant="outlined" sx={{ borderRadius: 3, maxWidth: 640 }}>
        <CardContent sx={{ p: { xs: 2, sm: 2.75 } }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 0.25 }}>
            Why {match.team.name} is a {match.score}% match
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
            Based on your team's profile and availability
          </Typography>

          <Stack spacing={0}>
            {match.factors.map((factor) => (
              <Stack
                key={factor.factor}
                direction="row"
                spacing={1.5}
                sx={{ justifyContent: 'space-between', alignItems: 'center', py: 1.25, borderBottom: 1, borderColor: 'divider', '&:last-of-type': { borderBottom: 'none' } }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {factor.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {factor.reason}
                  </Typography>
                </Box>
                <Box sx={{ width: 110, height: 6, borderRadius: 3, bgcolor: brand.mist, flexShrink: 0, overflow: 'hidden' }}>
                  <Box sx={{ width: `${Math.round(factor.ratio * 100)}%`, height: '100%', bgcolor: brand.pitch }} />
                </Box>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
