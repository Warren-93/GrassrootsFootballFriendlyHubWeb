import { useEffect, useState } from 'react';
import { Alert, Button, Card, CardContent, Chip, CircularProgress, Container, Stack, Typography } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import { useNavigate, useParams } from 'react-router-dom';
import { friendlyRequestRepository } from '../../api/friendlyRequestRepository';
import { conversationRepository } from '../../api/conversationRepository';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { PageHeader } from '../../components/PageHeader';
import { brand } from '../../theme/theme';
import type { FriendlyRequestView } from '../../api/types';

const STATUS_STYLE: Record<string, { bgcolor: string; color: string }> = {
  ACCEPTED: { bgcolor: '#E4F4E4', color: brand.pitchDeep },
  CONFIRMED: { bgcolor: '#E4F4E4', color: brand.pitchDeep },
  DECLINED: { bgcolor: brand.coralBg, color: brand.coral },
  SENT: { bgcolor: brand.amberBg, color: brand.amber },
  CHANGES_REQUESTED: { bgcolor: brand.amberBg, color: brand.amber },
  UPDATED: { bgcolor: brand.amberBg, color: brand.amber },
};

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
  const { active } = useCurrentTeam();
  const { requestId } = useParams<{ requestId: string }>();
  const [request, setRequest] = useState<FriendlyRequestView | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);

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

  async function handleMessage() {
    if (!active || !request) return;
    const otherTeamId = active.teamId === request.senderTeamId ? request.recipientTeamId : request.senderTeamId;
    setOpening(true);
    setErrorMessage(null);
    const result = await conversationRepository.start(active.teamId, otherTeamId);
    setOpening(false);
    if (result.ok) navigate(`/messages/${result.value.id}`);
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
    <Container maxWidth="xs" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <PageHeader title="Friendly request" />
        <Chip label={request.status.replace(/_/g, ' ')} sx={{ alignSelf: 'flex-start', ...(STATUS_STYLE[request.status] ?? {}) }} />

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={1}>
              <Row label="Date" value={request.date} />
              <Row label="Time" value={`${request.startTime.slice(0, 5)} - ${request.endTime.slice(0, 5)}`} />
              <Row label="Cost share" value={request.costShare.replace(/_/g, ' ')} />
              <Row label="Referee" value={request.refereeArrangement.replace(/_/g, ' ')} />
            </Stack>
          </CardContent>
        </Card>

        {request.message && <Typography variant="body2">Message: "{request.message}"</Typography>}
        {request.actionReason && (
          <Typography variant="body2">
            {request.status === 'DECLINED' ? 'Reason for declining' : 'Requested changes'}: "{request.actionReason}"
          </Typography>
        )}

        {(request.senderContact || request.recipientContact) && (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Contact details
              </Typography>
              <Stack spacing={1}>
                {request.senderContact?.managerName && (
                  <Row label="Sender" value={`${request.senderContact.managerName} ${request.senderContact.contactPhone ?? ''}`} />
                )}
                {request.recipientContact?.managerName && (
                  <Row label="Recipient" value={`${request.recipientContact.managerName} ${request.recipientContact.contactPhone ?? ''}`} />
                )}
              </Stack>
            </CardContent>
          </Card>
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

        {active && (
          <Button
            variant="outlined"
            startIcon={<ChatBubbleOutlineIcon />}
            disabled={opening}
            onClick={handleMessage}
          >
            {opening ? 'Opening…' : 'Message the other team'}
          </Button>
        )}

        {active && (
          <Button
            variant="text"
            color="error"
            onClick={() => {
              const otherTeamId =
                active.teamId === request.senderTeamId ? request.recipientTeamId : request.senderTeamId;
              navigate(`/report?teamId=${otherTeamId}`);
            }}
          >
            Report or block
          </Button>
        )}
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
