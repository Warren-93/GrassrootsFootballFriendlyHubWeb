import { useEffect, useState } from 'react';
import { Alert, Button, Container, Stack, TextField, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { friendlyRequestRepository } from '../../api/friendlyRequestRepository';
import { isLeague } from '../../utils/league';
import type { FriendlyRequestView } from '../../api/types';

export function DeclinePage() {
  const navigate = useNavigate();
  const { requestId } = useParams<{ requestId: string }>();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [request, setRequest] = useState<FriendlyRequestView | null>(null);

  useEffect(() => {
    if (!requestId) return;
    friendlyRequestRepository.get(requestId).then((result) => {
      if (result.ok) setRequest(result.value);
    });
  }, [requestId]);

  // Declining a league fixture is only for one added in error, and needs a reason.
  const league = isLeague(request);

  async function handleSubmit() {
    if (!requestId) return;
    setSubmitting(true);
    setErrorMessage(null);
    const result = await friendlyRequestRepository.act(requestId, 'decline', reason || undefined);
    setSubmitting(false);
    if (result.ok) navigate(`/request/${requestId}`);
    else setErrorMessage(result.message);
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack spacing={3} sx={{ maxWidth: 480 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {league ? 'Decline league fixture' : 'Decline request'}
        </Typography>
        {league && (
          <Alert severity="info">
            Only decline a league fixture that was added in error, such as the wrong opponent or a fixture that isn't
            yours. To move the date, kick-off or venue, ask for a change instead.
          </Alert>
        )}
        <TextField
          label="Reason (shown to the sender)"
          required={league}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          multiline
          minRows={3}
          fullWidth
        />
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        <Stack direction="row" spacing={1.5}>
          <Button variant="contained" color="error" size="large" disabled={submitting || (league && !reason.trim())} onClick={handleSubmit}>
            {submitting ? 'Declining…' : 'Decline'}
          </Button>
          <Button variant="text" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
