import { useState } from 'react';
import { Alert, Button, Container, Stack, Typography } from '@mui/material';
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
    });
    setSubmitting(false);
    if (result.ok) {
      setDraft(null);
      navigate(`/invite/sent/${result.value.id}`, { replace: true });
    } else {
      setErrorMessage(result.message);
    }
  }

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Stack spacing={2}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Review invitation
        </Typography>

        <Typography variant="body2">Date: {draft.date}</Typography>
        <Typography variant="body2">
          Time: {draft.startTime.slice(0, 5)} - {draft.endTime.slice(0, 5)}
        </Typography>
        <Typography variant="body2">Home team: {draft.homeTeamId === active.teamId ? 'Us' : 'Them'}</Typography>
        <Typography variant="body2">Cost share: {draft.costShare.replace(/_/g, ' ')}</Typography>
        <Typography variant="body2">Referee: {draft.refereeArrangement.replace(/_/g, ' ')}</Typography>
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
