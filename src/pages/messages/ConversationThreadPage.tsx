import { useState } from 'react';
import { Box, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useParams } from 'react-router-dom';
import { ConversationListPanel } from './ConversationListPanel';
import { ConversationThreadPanel } from './ConversationThreadPanel';
import type { MessageView } from '../../api/types';

/**
 * One open conversation. On desktop this is the right pane of a persistent
 * two-pane layout (list + thread), matching `ConversationsListPage`'s own
 * desktop/mobile split so the two routes together behave like one inbox; on
 * mobile it's a single full-width thread.
 */
export function ConversationThreadPage() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const { conversationId } = useParams<{ conversationId: string }>();
  // The last message sent in each conversation, so the inbox beside the
  // thread shows it without fetching the whole list again.
  const [sentMessages, setSentMessages] = useState<Record<string, MessageView>>({});

  function handleSent(message: MessageView) {
    setSentMessages((prev) => ({ ...prev, [message.conversationId]: message }));
  }

  if (!conversationId) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.secondary">No conversation selected.</Typography>
      </Box>
    );
  }

  if (isDesktop) {
    return (
      <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
        <Box sx={{ width: 258, flexShrink: 0, borderRight: 1, borderColor: 'divider', overflowY: 'auto' }}>
          <Box sx={{ px: 2, pt: 2.5, pb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 16 }}>
              Messages
            </Typography>
          </Box>
          <ConversationListPanel selectedConversationId={conversationId} sentMessages={sentMessages} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <ConversationThreadPanel conversationId={conversationId} onSent={handleSent} />
        </Box>
      </Box>
    );
  }

  return <ConversationThreadPanel conversationId={conversationId} />;
}
