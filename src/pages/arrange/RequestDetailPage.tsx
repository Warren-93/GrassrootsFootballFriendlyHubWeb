import { useEffect, useState } from 'react';
import { Alert, Button, Chip, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { friendlyRequestRepository } from '../../api/friendlyRequestRepository';
import type { FriendlyRequestView } from '../../api/types';

const DIRECT_ACTIONS = new Set(['accept', 'withdraw', 'cancel']);

const ACTION_LABELS: Record<string, string> = {
  accept: 'Accept',
  suggestChanges: 'Suggest changes',
  decline: 'Decline',
  withdraw: 'Withdraw',
  cancel: 'Cancel fixture',
  acceptChanges: 'Accept changes',
  counter: 'Send again',
};

export function RequestDetailPage() {
  const navigate = useNavigate();
  const { requestId } = useParams<{ requestId: string }>();
  const [request, setRequest] = useState<FriendlyRequestView | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function load() {
    if (!requestId) return;
    friendlyRequestRepository.get(requestId).then((result) => {
      if (result.ok) setRequest(result.value);
      setLoading(false);
    });
  }

  useEffect(load, [requestId]);

  async function handleAction(action: string) {
    if (!requestId) return;
    if (action === 'suggestChanges') return navigate(`/request/${requestId}/suggest-changes`);
    if (action === 'decline') return navigate(`/request/${requestId}/decline`);

    setActing(true);
    setErrorMessage(null);
    const result = await friendlyRequestRepository.act(requestId, action);
    setActing(false);
    if (result.ok) setRequest(result.value);
    else setErrorMessage(result.message);
  }

  if (loading) {
    return (
      <Container maxWidth="xs" sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!request) {
    return (
      <Container maxWidth="xs" sx={{ py: 6 }}>
        <Typography>Request not found.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Stack spacing={2}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Friendly request
        </Typography>
        <Chip label={request.status} sx={{ alignSelf: 'flex-start' }} />

        <Typography variant="body2">Date: {request.date}</Typography>
        <Typography variant="body2">
          Time: {request.startTime.slice(0, 5)} - {request.endTime.slice(0, 5)}
        </Typography>
        <Typography variant="body2">Cost share: {request.costShare.replace(/_/g, ' ')}</Typography>
        <Typography variant="body2">Referee: {request.refereeArrangement.replace(/_/g, ' ')}</Typography>
        {request.message && <Typography variant="body2">Message: "{request.message}"</Typography>}
        {request.actionReason && (
          <Typography variant="body2">
            {request.status === 'DECLINED' ? 'Reason for declining' : 'Requested changes'}: "{request.actionReason}"
          </Typography>
        )}

        {(request.senderContact || request.recipientContact) && (
          <Stack spacing={0.5}>
            <Typography variant="subtitle2">Contact details</Typography>
            {request.senderContact?.managerName && (
              <Typography variant="body2">
                Sender: {request.senderContact.managerName} {request.senderContact.contactPhone ?? ''}
              </Typography>
            )}
            {request.recipientContact?.managerName && (
              <Typography variant="body2">
                Recipient: {request.recipientContact.managerName} {request.recipientContact.contactPhone ?? ''}
              </Typography>
            )}
          </Stack>
        )}

        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        <Stack spacing={1}>
          {request.availableActions.map((action) => (
            <Button
              key={action}
              variant={DIRECT_ACTIONS.has(action) ? 'contained' : 'outlined'}
              disabled={acting}
              onClick={() => handleAction(action)}
            >
              {ACTION_LABELS[action] ?? action}
            </Button>
          ))}
        </Stack>
      </Stack>
    </Container>
  );
}
