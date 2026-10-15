import { useEffect, useState } from 'react';
import { Alert, Button, Card, CardContent, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { matchRepository } from '../../api/matchRepository';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { useSearchResultsStore } from '../../session/SearchState';
import { brand } from '../../theme/theme';

// Discover / SCR-HM-03 Suggested matches. There is no filter step: the API
// returns every team with the same age group and gender, all ability levels
// and formats included, ranked by fit, and this lands straight on the results.
export function SuggestedMatchesPage() {
  const navigate = useNavigate();
  const { active } = useCurrentTeam();
  const teamId = active?.teamId;
  const setResponse = useSearchResultsStore((s) => s.setResponse);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) return;
    matchRepository.search({ teamId: teamId, limit: 50 }).then((result) => {
      if (result.ok) {
        setResponse(result.value);
        navigate('/results', { replace: true });
      } else {
        setErrorMessage(result.message);
      }
    });
  }, [teamId, navigate, setResponse]);

  if (!active) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Card variant="outlined">
          <CardContent sx={{ py: 5, textAlign: 'center' }}>
            <Stack spacing={2} sx={{ alignItems: 'center' }}>
              <Typography color="text.secondary">No team selected.</Typography>
              <Button variant="text" onClick={() => navigate(-1)}>
                Back
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card variant="outlined">
        <CardContent sx={{ py: 6 }}>
          <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center' }}>
            {errorMessage ? (
              <>
                <Alert severity="error" sx={{ width: '100%' }}>
                  {errorMessage}
                </Alert>
                <Button variant="text" onClick={() => navigate(-1)}>
                  Back
                </Button>
              </>
            ) : (
              <>
                <CircularProgress sx={{ color: brand.pitch }} />
                <Typography sx={{ fontWeight: 700 }}>Finding teams to play…</Typography>
                <Typography variant="body2" color="text.secondary">
                  Every team in your age group and gender, best fit first.
                </Typography>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
