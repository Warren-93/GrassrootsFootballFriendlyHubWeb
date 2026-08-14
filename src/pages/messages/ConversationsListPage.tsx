import { useEffect, useState } from 'react';
import { Avatar, Card, CardActionArea, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { conversationRepository } from '../../api/conversationRepository';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import type { ConversationView } from '../../api/types';

/** The inbox - every team you're chatting with, most recently active first. */
export function ConversationsListPage() {
  const navigate = useNavigate();
  const { active } = useCurrentTeam();
  const [conversations, setConversations] = useState<ConversationView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!active) {
      setLoading(false);
      return;
    }
    conversationRepository.list(active.teamId).then((result) => {
      if (result.ok) setConversations(result.value);
      setLoading(false);
    });
  }, [active]);

  if (!active) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Typography>No active team. Create or select a team first.</Typography>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Messages
        </Typography>

        {conversations.length === 0 ? (
          <Typography color="text.secondary">
            No conversations yet. Message a team from their profile once they've published availability.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {conversations.map((c) => {
              const mine = c.lastMessageSenderTeamId === active.teamId;
              return (
                <Card key={c.id} variant="outlined">
                  <CardActionArea onClick={() => navigate(`/messages/${c.id}`)} sx={{ p: 1.5 }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <Avatar src={c.otherTeam.badgeUrl ?? undefined}>{c.otherTeam.name[0]}</Avatar>
                      <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 600 }} noWrap>
                          {c.otherTeam.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {c.lastMessageBody ? `${mine ? 'You: ' : ''}${c.lastMessageBody}` : 'No messages yet'}
                        </Typography>
                      </Stack>
                      {c.lastMessageAt && (
                        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                          {new Date(c.lastMessageAt).toLocaleDateString()}
                        </Typography>
                      )}
                    </Stack>
                  </CardActionArea>
                </Card>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
