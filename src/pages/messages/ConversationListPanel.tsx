import { useEffect, useState } from 'react';
import { Box, Card, CardActionArea, CircularProgress, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { conversationRepository } from '../../api/conversationRepository';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import type { ConversationView } from '../../api/types';
import { CrestAvatar } from '../../components/brand/CrestAvatar';
import { brand } from '../../theme/theme';

interface ConversationListPanelProps {
  /** The conversation currently open in the thread pane, if any - highlighted in the list. */
  selectedConversationId?: string;
}

function relativeTime(iso: string): string {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

/**
 * The inbox list - every team you're chatting with, most recently active
 * first. Reused as the left pane of the two-pane desktop layout (both on
 * `/messages` and `/messages/:conversationId`) and as the whole of
 * `/messages` on mobile.
 */
export function ConversationListPanel({ selectedConversationId }: ConversationListPanelProps) {
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
      <Box sx={{ p: 2 }}>
        <Typography>No active team. Create or select a team first.</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (conversations.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">
          No conversations yet. Message a team from their profile once they've published availability.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1} sx={{ p: 1.5 }}>
      {conversations.map((c) => {
        const mine = c.lastMessageSenderTeamId === active.teamId;
        const isSelected = c.id === selectedConversationId;
        return (
          <Card
            key={c.id}
            variant="outlined"
            sx={isSelected ? { bgcolor: brand.mist, borderColor: brand.void } : undefined}
          >
            <CardActionArea onClick={() => navigate(`/messages/${c.id}`)} sx={{ p: 1.5 }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <CrestAvatar name={c.otherTeam.name} size={40} />
                <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700 }} noWrap>
                    {c.otherTeam.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {c.lastMessageBody ? `${mine ? 'You: ' : ''}${c.lastMessageBody}` : 'No messages yet'}
                  </Typography>
                </Stack>
                {c.lastMessageAt && (
                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, fontSize: 10.5 }}>
                    {relativeTime(c.lastMessageAt)}
                  </Typography>
                )}
              </Stack>
            </CardActionArea>
          </Card>
        );
      })}
    </Stack>
  );
}
