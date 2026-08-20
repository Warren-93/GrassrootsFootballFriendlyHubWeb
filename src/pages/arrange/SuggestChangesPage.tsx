import { useEffect, useState } from 'react';
import {
  Alert,
  Container,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { friendlyRequestRepository } from '../../api/friendlyRequestRepository';
import { venueRepository } from '../../api/venueRepository';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import type { FriendlyRequestView, VenueView } from '../../api/types';

export function SuggestChangesPage() {
  const navigate = useNavigate();
  const { active } = useCurrentTeam();
  const { requestId } = useParams<{ requestId: string }>();
  const [request, setRequest] = useState<FriendlyRequestView | null>(null);
  const [venues, setVenues] = useState<VenueView[]>([]);
  const [reason, setReason] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venueId, setVenueId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId) return;
    friendlyRequestRepository.get(requestId).then((result) => {
      if (result.ok) {
        setRequest(result.value);
        setStartTime(result.value.startTime.slice(0, 5));
        setEndTime(result.value.endTime.slice(0, 5));
        setVenueId(result.value.venueId ?? '');
      }
    });
  }, [requestId]);

  useEffect(() => {
    if (!active) return;
    venueRepository.list(active.clubId).then((result) => {
      if (result.ok) setVenues(result.value);
    });
  }, [active?.clubId]);

  async function handleSubmit() {
    if (!requestId || !request) return;
    setSubmitting(true);
    setErrorMessage(null);
    const result = await friendlyRequestRepository.suggestChanges(requestId, {
      reason: reason || undefined,
      proposedStartTime: startTime !== request.startTime.slice(0, 5) ? `${startTime}:00` : undefined,
      proposedEndTime: endTime !== request.endTime.slice(0, 5) ? `${endTime}:00` : undefined,
      proposedVenueId: venueId && venueId !== (request.venueId ?? '') ? venueId : undefined,
    });
    setSubmitting(false);
    if (result.ok) navigate(`/request/${requestId}`);
    else setErrorMessage(result.message);
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack spacing={3} sx={{ maxWidth: 480 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Suggest changes
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Propose a different kick-off time or venue. The date itself can't change here - decline and start a new
          request if a different day works better.
        </Typography>

        <Stack direction="row" spacing={2}>
          <TextField
            label="Start time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
          <TextField
            label="End time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
        </Stack>

        {venues.length > 0 && (
          <TextField select label="Venue" value={venueId} onChange={(e) => setVenueId(e.target.value)} fullWidth>
            <MenuItem value="">No change</MenuItem>
            {venues.map((v) => (
              <MenuItem key={v.id} value={v.id}>
                {v.name}
              </MenuItem>
            ))}
          </TextField>
        )}

        <TextField
          label="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          multiline
          minRows={3}
          fullWidth
        />
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        <Stack direction="row" spacing={1.5}>
          <Button variant="contained" size="large" disabled={submitting} onClick={handleSubmit}>
            {submitting ? 'Sending…' : 'Send'}
          </Button>
          <Button variant="text" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
