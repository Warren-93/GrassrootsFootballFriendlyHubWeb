import { useEffect, useState } from 'react';
import { Alert, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { matchRepository } from '../../api/matchRepository';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { useSearchResultsStore } from '../../session/SearchState';

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
      <Container maxWidth="xs" sx={{ py: 6 }}>
        <Typography>No team selected.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Stack spacing={3} sx={{ alignItems: 'center', textAlign: 'center' }}>
        {errorMessage ? (
          <Alert severity="error" sx={{ width: '100%' }}>
            {errorMessage}
          </Alert>
        ) : (
          <>
            <CircularProgress />
            <Typography color="text.secondary">Finding suggested matches…</Typography>
          </>
        )}
      </Stack>
    </Container>
  );
}
