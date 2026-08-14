import { useEffect, useRef, useState } from 'react';
import { Alert, Box, CircularProgress, IconButton, Stack, TextField, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useNavigate, useParams } from 'react-router-dom';
import { conversationRepository } from '../../api/conversationRepository';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { PageHeader } from '../../components/PageHeader';
import type { ConversationView, MessageView } from '../../api/types';

const POLL_MS = 4000;

/** An instant-message-style chat with one other team - available as soon as they've published availability. */
export function ConversationThreadPage() {
  const navigate = useNavigate();
  const { active } = useCurrentTeam();
  const { conversationId } = useParams<{ conversationId: string }>();
  const [conversation, setConversation] = useState<ConversationView | null>(null);
  const [messages, setMessages] = useState<MessageView[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  function loadMessages(id: string) {
    conversationRepository.messages(id).then((result) => {
      if (result.ok) setMessages(result.value);
    });
  }

  useEffect(() => {
    if (!conversationId) return;
    conversationRepository.get(conversationId).then((result) => {
      if (result.ok) setConversation(result.value);
      else setErrorMessage(result.message);
      setLoading(false);
    });
    loadMessages(conversationId);
    const timer = setInterval(() => loadMessages(conversationId), POLL_MS);
    return () => clearInterval(timer);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function handleSend() {
    if (!conversationId || !draft.trim()) return;
    setSending(true);
    setErrorMessage(null);
    const result = await conversationRepository.send(conversationId, draft.trim());
    setSending(false);
    if (result.ok) {
      setDraft('');
      loadMessages(conversationId);
    } else {
      setErrorMessage(result.message);
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!conversation) {
    return (
      <Box sx={{ p: 3 }}>
        <PageHeader title="Conversation" onBack={() => navigate('/messages')} />
        <Alert severity="error" sx={{ mt: 2 }}>
          {errorMessage ?? 'That conversation could not be found.'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 3, pt: 3, pb: 1 }}>
        <PageHeader title={conversation.otherTeam.name} onBack={() => navigate('/messages')} />
        <Typography variant="body2" color="text.secondary">
          {conversation.otherTeam.clubName}
        </Typography>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 3, py: 2 }}>
        {messages.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
            No messages yet - say hello.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {messages.map((m) => {
              const isMine = m.senderTeamId === active?.teamId;
              return (
                <Box key={m.id} sx={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                  <Box
                    sx={{
                      maxWidth: '75%',
                      px: 1.5,
                      py: 1,
                      borderRadius: 2,
                      bgcolor: isMine ? 'primary.main' : 'action.hover',
                      color: isMine ? 'primary.contrastText' : 'text.primary',
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {m.body}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ opacity: 0.7, display: 'block', mt: 0.25, textAlign: isMine ? 'right' : 'left' }}
                    >
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
            <div ref={bottomRef} />
          </Stack>
        )}
      </Box>

      {errorMessage && (
        <Box sx={{ px: 3 }}>
          <Alert severity="error" onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        </Box>
      )}

      <Stack direction="row" spacing={1} sx={{ p: 2, borderTop: 1, borderColor: 'divider', alignItems: 'flex-end' }}>
        <TextField
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Message…"
          size="small"
          fullWidth
          multiline
          maxRows={4}
        />
        <IconButton color="primary" disabled={sending || !draft.trim()} onClick={handleSend} aria-label="Send">
          <SendIcon />
        </IconButton>
      </Stack>
    </Box>
  );
}
