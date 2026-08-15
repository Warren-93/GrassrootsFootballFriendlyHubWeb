import { useState } from 'react';
import { Alert, Button, Card, CardContent, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { useInvitationDraftStore } from '../../session/SearchState';
import { friendlyRequestRepository } from '../../api/friendlyRequestRepository';

export function InvitationReviewPage() {
  const navigate = useNavigate();
  const { active } = useCurrentTeam();
  const draft = useInvitationDraftStore((s) => s.draft);
  const setDraft = useInvitationDraftStore((s) => s.setDraft);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Generated once per visit to this page, not per click - so retrying a
  // failed send (network blip, double-click) reuses the same key and the
  // backend recognizes it as the same attempt, never a second proposal.
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  if (!draft || !active) {
    return (
      <Container maxWidth="xs" sx={{ py: 6 }}>
        <Typography>No invitation in progress.</Typography>
      </Container>
    );
  }

  async function handleSend() {
    if (!draft || !active) return;
    setSubmitting(true);
    setErrorMessage(null);
    const result = await friendlyRequestRepository.send({
      senderTeamId: active.teamId,
      recipientTeamId: draft.opponentTeamId,
      senderSlotId: draft.ourSlotId,
      recipientSlotId: draft.theirSlotId,
      date: draft.date,
      startTime: draft.startTime,
      endTime: draft.endTime,
      venueId: draft.venueId,
      homeTeamId: draft.homeTeamId,
      costShare: draft.costShare,
      refereeArrangement: draft.refereeArrangement,
      message: draft.message || null,
    }, idempotencyKey);
    setSubmitting(false);
    if (result.ok) {
      setDraft(null);
      navigate(`/invite/sent/${result.value.id}`, { replace: true });
    } else {
      setErrorMessage(result.message);
    }
  }

  return (
    <Container maxWidth="xs" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <Typography variant="h4" sx={{ fontWeight: 400 }}>
          Review before sending
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Double-check the details - you can still edit anything.
        </Typography>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={1}>
              <Row label="Date" value={draft.date} />
              <Row label="Time" value={`${draft.startTime.slice(0, 5)} - ${draft.endTime.slice(0, 5)}`} />
              <Row label="Home team" value={draft.homeTeamId === active.teamId ? 'Us' : 'Them'} />
              <Row label="Cost share" value={draft.costShare.replace(/_/g, ' ')} />
              <Row label="Referee" value={draft.refereeArrangement.replace(/_/g, ' ')} />
            </Stack>
          </CardContent>
        </Card>
        {draft.message && <Typography variant="body2">Message: "{draft.message}"</Typography>}

        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        <Button variant="contained" size="large" disabled={submitting} onClick={handleSend}>
          {submitting ? 'Sending…' : 'Send invitation'}
        </Button>
        <Button variant="text" onClick={() => navigate(-1)}>
          Back
        </Button>
      </Stack>
    </Container>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>
        {value}
      </Typography>
    </Stack>
  );
}
