import { Box, Card, CardActionArea, CardContent, Chip, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSearchResultsStore } from '../../session/SearchState';

const BAND_COLOR: Record<string, 'success' | 'warning' | 'default'> = {
  EXCELLENT: 'success',
  GOOD: 'success',
  FAIR: 'warning',
};

export function ResultsListPage() {
  const navigate = useNavigate();
  const response = useSearchResultsStore((s) => s.response);

  if (!response) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Typography>No search yet.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <Typography variant="h6">{response.totalResults} matches found</Typography>

        {response.results.map((match) => (
          <Card key={match.team.id} variant="outlined">
            <CardActionArea onClick={() => navigate(`/opponent/${match.team.id}`)}>
              <CardContent>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {match.team.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {match.team.clubName} · {match.team.generalArea} · {match.milesApart.toFixed(1)} mi
                    </Typography>
                  </Box>
                  <Chip label={`${match.score}%`} color={BAND_COLOR[match.band] ?? 'default'} />
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                  {match.reasons.slice(0, 3).map((reason) => (
                    <Chip key={reason} size="small" label={reason} variant="outlined" />
                  ))}
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
    </Container>
  );
}
