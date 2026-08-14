import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import { useNavigate, useParams } from 'react-router-dom';
import { fixtureRepository } from '../../api/fixtureRepository';
import { conversationRepository } from '../../api/conversationRepository';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { PageHeader } from '../../components/PageHeader';
import type { FixtureView } from '../../api/types';

export function FixtureDetailPage() {
  const navigate = useNavigate();
  const { active } = useCurrentTeam();
  const { fixtureId } = useParams<{ fixtureId: string }>();
  const [fixture, setFixture] = useState<FixtureView | null>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    if (!fixtureId) return;
    fixtureRepository.get(fixtureId).then((result) => {
      if (result.ok) setFixture(result.value);
      setLoading(false);
    });
  }, [fixtureId]);

  async function openChat() {
    if (!active || !fixture) return;
    const otherTeamId = active.teamId === fixture.homeTeam.id ? fixture.awayTeam.id : fixture.homeTeam.id;
    setOpening(true);
    setMessageError(null);
    const result = await conversationRepository.start(active.teamId, otherTeamId);
    setOpening(false);
    if (result.ok) navigate(`/messages/${result.value.id}`);
    else setMessageError(result.message);
  }

  if (loading) {
    return (
      <Container maxWidth="xs" sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!fixture) {
    return (
      <Container maxWidth="xs" sx={{ py: 6 }}>
        <Typography>Fixture not found.</Typography>
      </Container>
    );
  }

  const weManage = active && (fixture.homeTeam.id === active.teamId || fixture.awayTeam.id === active.teamId);

  async function handleCancel() {
    if (!fixtureId) return;
    setCancelling(true);
    setCancelError(null);
    const result = await fixtureRepository.cancel(fixtureId, cancelReason.trim() || undefined);
    setCancelling(false);
    if (result.ok) {
      setFixture(result.value);
      setConfirmCancel(false);
    } else {
      setCancelError(result.message);
    }
  }

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Stack spacing={2}>
        <PageHeader title={`${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`} />
        <Chip label={fixture.status} sx={{ alignSelf: 'flex-start' }} />

        <Typography variant="body2">
          {fixture.date}, kick-off {fixture.startTime.slice(0, 5)} - {fixture.endTime.slice(0, 5)}
        </Typography>
        <Typography variant="body2">Cost share: {fixture.costShare.replace(/_/g, ' ')}</Typography>
        <Typography variant="body2">Referee: {fixture.refereeArrangement.replace(/_/g, ' ')}</Typography>

        <Stack spacing={0.5}>
          <Typography variant="subtitle2">Home team contact</Typography>
          <Typography variant="body2">
            {fixture.homeTeam.managerName ?? '—'} {fixture.homeTeam.contactPhone ?? ''}
          </Typography>
        </Stack>
        <Stack spacing={0.5}>
          <Typography variant="subtitle2">Away team contact</Typography>
          <Typography variant="body2">
            {fixture.awayTeam.managerName ?? '—'} {fixture.awayTeam.contactPhone ?? ''}
          </Typography>
        </Stack>

        {messageError && <Alert severity="error">{messageError}</Alert>}
        {weManage && (
          <Button variant="outlined" startIcon={<ChatBubbleOutlineIcon />} disabled={opening} onClick={openChat}>
            {opening ? 'Opening…' : 'Message the other team'}
          </Button>
        )}

        {cancelError && <Alert severity="error">{cancelError}</Alert>}

        {weManage && fixture.status === 'CONFIRMED' && (
          <Button variant="outlined" color="error" onClick={() => setConfirmCancel(true)}>
            Cancel fixture
          </Button>
        )}

        {active && (
          <Button
            variant="text"
            color="error"
            onClick={() => {
              const otherTeam = active.teamId === fixture.homeTeam.id ? fixture.awayTeam : fixture.homeTeam;
              navigate(`/report?teamId=${otherTeam.id}&teamName=${encodeURIComponent(otherTeam.name)}&fixtureId=${fixture.id}`);
            }}
          >
            Report or block
          </Button>
        )}
      </Stack>

      <Dialog open={confirmCancel} onClose={() => setConfirmCancel(false)}>
        <DialogTitle>Cancel this fixture?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            The other team will be notified. This can't be undone - you'd need to arrange a new friendly from
            scratch.
          </DialogContentText>
          <TextField
            label="Reason (optional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmCancel(false)}>Back</Button>
          <Button color="error" onClick={handleCancel} disabled={cancelling}>
            {cancelling ? 'Cancelling…' : 'Cancel fixture'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
