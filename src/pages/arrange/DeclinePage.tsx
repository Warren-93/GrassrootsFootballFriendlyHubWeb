import { useState } from 'react';
import { Alert, Button, Container, Stack, TextField, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { friendlyRequestRepository } from '../../api/friendlyRequestRepository';

// Same gap as SuggestChangesPage - the reason isn't sent to the backend yet.
export function DeclinePage() {
  const navigate = useNavigate();
  const { requestId } = useParams<{ requestId: string }>();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit() {
    if (!requestId) return;
    setSubmitting(true);
    setErrorMessage(null);
    const result = await friendlyRequestRepository.act(requestId, 'decline');
    setSubmitting(false);
    if (result.ok) navigate(`/request/${requestId}`);
    else setErrorMessage(result.message);
  }

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Decline request
        </Typography>
        <TextField
          label="Reason (shown to the sender)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          multiline
          minRows={3}
          fullWidth
        />
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        <Button variant="contained" color="error" size="large" disabled={submitting} onClick={handleSubmit}>
          {submitting ? 'Declining…' : 'Decline'}
        </Button>
        <Button variant="text" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </Stack>
    </Container>
  );
}
