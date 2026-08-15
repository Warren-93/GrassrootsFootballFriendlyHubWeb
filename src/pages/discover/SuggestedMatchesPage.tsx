import { useEffect, useState } from 'react';
import { Alert, Button, Card, CardContent, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { matchRepository } from '../../api/matchRepository';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { useSearchResultsStore } from '../../session/SearchState';
import { brand } from '../../theme/theme';

// SCR-HM-03 Suggested matches. Purpose: show every opponent worth considering
// right now, without the manual filter step SCR-FF-01/02 require - lands
// straight on the existing results screen with no filters applied.
export function SuggestedMatchesPage() {
  const navigate = useNavigate();
  const { active } = useCurrentTeam();
  const setResponse = useSearchResultsStore((s) => s.setResponse);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    matchRepository.search({ teamId: active.teamId, limit: 20 }).then((result) => {
      if (result.ok) {
        setResponse(result.value);
        navigate('/results', { replace: true });
      } else {
        setErrorMessage(result.message);
      }
    });
  }, [active?.teamId]);

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
                <Typography sx={{ fontWeight: 700 }}>Finding suggested matches…</Typography>
                <Typography variant="body2" color="text.secondary">
                  Matching your published availability against nearby teams.
                </Typography>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
