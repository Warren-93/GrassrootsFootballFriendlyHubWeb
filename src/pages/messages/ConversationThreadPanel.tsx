import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Chip, CircularProgress, IconButton, Stack, TextField, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccerOutlined';
import { useNavigate } from 'react-router-dom';
import { conversationRepository } from '../../api/conversationRepository';
import { EmojiPickerButton } from '../../components/chat/EmojiPickerButton';
import { GifPickerButton } from '../../components/chat/GifPickerButton';
import { useClientConfig } from '../../session/ClientConfigState';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { PageHeader } from '../../components/PageHeader';
import { CrestAvatar } from '../../components/brand/CrestAvatar';
import { brand } from '../../theme/theme';
import type { ConversationView, GifView, MessageView } from '../../api/types';
import { mergeMessages, nextPollDelay, pollSince } from './chatPolling';

interface ConversationThreadPanelProps {
  conversationId: string;
  /** Called with each message sent, so the inbox beside the thread can show it straight away. */
  onSent?: (message: MessageView) => void;
}

/**
 * The message-bubble thread and composer for one conversation. Reused as the
 * right pane of the two-pane desktop layout and as the whole of
 * `/messages/:conversationId` on mobile.
 */
export function ConversationThreadPanel({ conversationId, onSent }: ConversationThreadPanelProps) {
  const navigate = useNavigate();
  const { active } = useCurrentTeam();
  const [conversation, setConversation] = useState<ConversationView | null>(null);
  const [messages, setMessages] = useState<MessageView[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { config } = useClientConfig();
  // The messages held and when the chat last saw a new one, for the poll loop below.
  const messagesRef = useRef<MessageView[]>([]);
  const lastActivityRef = useRef(Date.now());

  function addMessages(incoming: MessageView[]) {
    const merged = mergeMessages(messagesRef.current, incoming);
    if (merged === messagesRef.current) return;
    messagesRef.current = merged;
    lastActivityRef.current = Date.now();
    setMessages(merged);
  }

  // Polls for new messages only (since the newest one held), quickly while
  // the chat is lively and every 15s once it's quiet. Nothing is fetched while
  // the tab is hidden; coming back to it checks straight away.
  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    let timer: number | undefined;
    messagesRef.current = [];
    lastActivityRef.current = Date.now();
    setMessages([]);
    setLoading(true);
    setConversation(null);
    setErrorMessage(null);
    conversationRepository.get(conversationId).then((result) => {
      if (cancelled) return;
      if (result.ok) setConversation(result.value);
      else setErrorMessage(result.message);
      setLoading(false);
    });

    async function poll() {
      window.clearTimeout(timer);
      if (inFlight) return;
      if (!document.hidden) {
        inFlight = true;
        const result = await conversationRepository.messages(conversationId, pollSince(messagesRef.current));
        inFlight = false;
        if (cancelled) return;
        if (result.ok) addMessages(result.value.filter((m) => m.conversationId === conversationId));
      }
      if (!cancelled) timer = window.setTimeout(poll, nextPollDelay(lastActivityRef.current, Date.now()));
    }

    function onVisibilityChange() {
      if (document.hidden) return;
      lastActivityRef.current = Date.now();
      void poll();
    }

    void poll();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function handleSend(gif?: GifView) {
    // A GIF goes on its own; whatever is typed stays in the box.
    const body = gif ? '' : draft.trim();
    if (!body && !gif) return;
    setSending(true);
    setErrorMessage(null);
    const result = await conversationRepository.send(conversationId, body, gif?.id);
    setSending(false);
    if (result.ok) {
      if (!gif) setDraft('');
      onSent?.(result.value);
      addMessages([result.value]);
    } else {
      setErrorMessage(result.message);
    }
  }

  /** Puts the emoji where the cursor is (or replaces the selection), then puts the cursor after it. */
  function insertEmoji(emoji: string) {
    const input = inputRef.current;
    const start = input?.selectionStart ?? draft.length;
    const end = input?.selectionEnd ?? draft.length;
    setDraft(draft.slice(0, start) + emoji + draft.slice(end));
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + emoji.length, start + emoji.length);
    });
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 3, pt: 3, pb: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <PageHeader
          title={conversation.otherTeam.name}
          onBack={() => navigate('/messages')}
          action={<CrestAvatar name={conversation.otherTeam.name} size={32} />}
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 5 }}>
          {conversation.otherTeam.clubName}
        </Typography>
        {conversation.relatedFixtureId && (
          <Chip
            icon={<SportsSoccerIcon sx={{ fontSize: 15 }} />}
            label="About a fixture - view it"
            size="small"
            onClick={() => navigate(`/fixtures/${conversation.relatedFixtureId}`)}
            sx={{ ml: 5, mt: 1, bgcolor: brand.mist, color: brand.ink2, fontWeight: 600 }}
          />
        )}
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
                      px: 1.75,
                      py: 1,
                      borderRadius: 2.5,
                      ...(isMine
                        ? { bgcolor: 'secondary.main', color: '#fff', borderBottomRightRadius: 6 }
                        : { bgcolor: brand.mist, color: brand.ink, borderBottomLeftRadius: 6 }),
                    }}
                  >
                    {m.gif && (
                      <Box
                        component="img"
                        src={m.gif.url}
                        alt={m.gif.title || 'GIF'}
                        loading="lazy"
                        sx={{
                          display: 'block',
                          maxWidth: '100%',
                          width: m.gif.width || undefined,
                          height: 'auto',
                          aspectRatio: m.gif.width && m.gif.height ? `${m.gif.width} / ${m.gif.height}` : undefined,
                          borderRadius: 1.5,
                          mt: 0.5,
                        }}
                      />
                    )}
                    {m.body && (
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {m.body}
                      </Typography>
                    )}
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

      <Stack direction="row" spacing={0.5} sx={{ p: 2, borderTop: 1, borderColor: 'divider', alignItems: 'flex-end' }}>
        <EmojiPickerButton onPick={insertEmoji} disabled={sending} />
        {config?.gifsEnabled && <GifPickerButton onPick={(gif) => handleSend(gif)} disabled={sending} />}
        <TextField
          inputRef={inputRef}
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
        <IconButton color="primary" disabled={sending || !draft.trim()} onClick={() => handleSend()} aria-label="Send">
          <SendIcon />
        </IconButton>
      </Stack>
    </Box>
  );
}
