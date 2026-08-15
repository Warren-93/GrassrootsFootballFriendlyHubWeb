import { Box, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { HeroBand } from '../../components/brand/HeroBand';
import { ConversationListPanel } from './ConversationListPanel';

/**
 * The inbox - every team you're chatting with, most recently active first.
 * On desktop this is the left pane of a persistent two-pane layout (list +
 * an empty-state placeholder until a conversation is opened); on mobile it's
 * a single full-width list, matching `ConversationThreadPage`'s own
 * desktop/mobile split so the two routes together behave like one inbox.
 */
export function ConversationsListPage() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });

  if (isDesktop) {
    return (
      <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
        <Box sx={{ width: 258, flexShrink: 0, borderRight: 1, borderColor: 'divider', overflowY: 'auto' }}>
          <Box sx={{ px: 2, pt: 2 }}>
            <HeroBand compact title="Messages" subtitle="Every conversation tied to a friendly or fixture." />
          </Box>
          <ConversationListPanel />
        </Box>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="text.secondary">Select a conversation to start reading</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 2, py: 3 }}>
      <HeroBand compact title="Messages" subtitle="Every conversation tied to a friendly or fixture." />
      <ConversationListPanel />
    </Box>
  );
}
