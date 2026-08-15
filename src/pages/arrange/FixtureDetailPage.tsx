import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import { useNavigate, useParams } from 'react-router-dom';
import { fixtureRepository } from '../../api/fixtureRepository';
import { conversationRepository } from '../../api/conversationRepository';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { FixtureBanner } from '../../components/brand/FixtureBanner';
import { brand } from '../../theme/theme';
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
      <Container maxWidth="lg" sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!fixture) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
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
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => navigate(-1)} aria-label="Back" edge="start">
            <ArrowBackIcon />
          </IconButton>
          <Chip
            label={fixture.status}
            size="small"
            sx={
              fixture.status === 'CONFIRMED'
                ? { bgcolor: '#E4F4E4', color: brand.pitchDeep }
                : { bgcolor: brand.mist, color: brand.muted }
            }
          />
        </Box>

        <FixtureBanner
          tag={fixture.status === 'CONFIRMED' ? 'Confirmed friendly' : fixture.status}
          homeTeam={fixture.homeTeam.name}
          awayTeam={fixture.awayTeam.name}
          date={fixture.date}
          meta={`${fixture.startTime.slice(0, 5)} - ${fixture.endTime.slice(0, 5)}`}
        />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Details
              </Typography>
              <Stack spacing={1}>
                <Row label="Cost share" value={fixture.costShare.replace(/_/g, ' ')} />
                <Row label="Referee" value={fixture.refereeArrangement.replace(/_/g, ' ')} />
                <Row
                  label="Home contact"
                  value={`${fixture.homeTeam.managerName ?? '—'} ${fixture.homeTeam.contactPhone ?? ''}`}
                />
                <Row
                  label="Away contact"
                  value={`${fixture.awayTeam.managerName ?? '—'} ${fixture.awayTeam.contactPhone ?? ''}`}
                />
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Actions
              </Typography>
              <Stack spacing={1.5}>
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
            </CardContent>
          </Card>
        </Box>
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
