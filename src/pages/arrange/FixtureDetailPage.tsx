import { useEffect, useState } from 'react';
import { Alert, Button, Card, CardContent, Chip, CircularProgress, Container, Stack, TextField, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { fixtureRepository } from '../../api/fixtureRepository';
import { messageRepository } from '../../api/messageRepository';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import type { FixtureView, MessageView } from '../../api/types';

export function FixtureDetailPage() {
  const navigate = useNavigate();
  const { active } = useCurrentTeam();
  const { fixtureId } = useParams<{ fixtureId: string }>();
  const [fixture, setFixture] = useState<FixtureView | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<MessageView[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);

  function loadMessages(id: string) {
    messageRepository.list(id).then((result) => {
      if (result.ok) setMessages(result.value);
    });
  }

  useEffect(() => {
    if (!fixtureId) return;
    fixtureRepository.get(fixtureId).then((result) => {
      if (result.ok) setFixture(result.value);
      setLoading(false);
    });
    loadMessages(fixtureId);
  }, [fixtureId]);

  async function handleSend() {
    if (!fixtureId || !newMessage.trim()) return;
    setSending(true);
    setMessageError(null);
    const result = await messageRepository.send(fixtureId, newMessage.trim());
    setSending(false);
    if (result.ok) {
      setNewMessage('');
      loadMessages(fixtureId);
    } else {
      setMessageError(result.message);
    }
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

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Stack spacing={2}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {fixture.homeTeam.name} vs {fixture.awayTeam.name}
        </Typography>
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

        <Stack spacing={1}>
          <Typography variant="subtitle2">Messages</Typography>
          {messages.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No messages yet.
            </Typography>
          ) : (
            messages.map((m) => {
              const senderName = m.senderTeamId === fixture.homeTeam.id ? fixture.homeTeam.name : fixture.awayTeam.name;
              return (
                <Card key={m.id} variant="outlined">
                  <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                    <Typography variant="caption" color="text.secondary">
                      {senderName} · {new Date(m.createdAt).toLocaleString()}
                    </Typography>
                    <Typography variant="body2">{m.body}</Typography>
                  </CardContent>
                </Card>
              );
            })
          )}
          {messageError && <Alert severity="error">{messageError}</Alert>}
          {active && (fixture.homeTeam.id === active.teamId || fixture.awayTeam.id === active.teamId) && (
            <Stack direction="row" spacing={1}>
              <TextField
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Message the other team…"
                size="small"
                fullWidth
              />
              <Button variant="contained" disabled={sending || !newMessage.trim()} onClick={handleSend}>
                Send
              </Button>
            </Stack>
          )}
        </Stack>

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
    </Container>
  );
}
