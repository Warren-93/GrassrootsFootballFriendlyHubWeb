import { lazy, Suspense, useState } from 'react';
import { Box, CircularProgress, IconButton, Popover, useTheme } from '@mui/material';
import EmojiIcon from '@mui/icons-material/EmojiEmotionsOutlined';
import type { EmojiStyle, Theme } from 'emoji-picker-react';

// The picker is ~250 KB, so it's only downloaded the first time someone opens it.
const EmojiPicker = lazy(() => import('emoji-picker-react'));

interface EmojiPickerButtonProps {
  onPick: (emoji: string) => void;
  disabled?: boolean;
}

/**
 * The smiley button beside the chat composer: a searchable emoji menu with
 * categories and recently used, using the device's own emoji font (no
 * images are fetched). Stays open so several can be picked in a row.
 */
export function EmojiPickerButton({ onPick, disabled }: EmojiPickerButtonProps) {
  const theme = useTheme();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <>
      <IconButton aria-label="Emoji" disabled={disabled} onClick={(e) => setAnchor(e.currentTarget)}>
        <EmojiIcon />
      </IconButton>
      <Popover
        open={anchor !== null}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Suspense
          fallback={
            <Box sx={{ width: 320, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress size={28} />
            </Box>
          }
        >
          <EmojiPicker
            onEmojiClick={(data) => onPick(data.emoji)}
            emojiStyle={'native' as EmojiStyle}
            theme={(theme.palette.mode === 'dark' ? 'dark' : 'light') as Theme}
            previewConfig={{ showPreview: false }}
            lazyLoadEmojis
            width={320}
            height={400}
          />
        </Suspense>
      </Popover>
    </>
  );
}
