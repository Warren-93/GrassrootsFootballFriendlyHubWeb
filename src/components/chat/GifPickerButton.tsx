import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  Popover,
  TextField,
  Typography,
} from '@mui/material';
import GifIcon from '@mui/icons-material/GifBoxOutlined';
import SearchIcon from '@mui/icons-material/Search';
import { gifRepository } from '../../api/gifRepository';
import type { GifView } from '../../api/types';

const SEARCH_DELAY_MS = 400;

interface GifPickerButtonProps {
  onPick: (gif: GifView) => void;
  disabled?: boolean;
}

/**
 * The GIF button beside the chat composer: trending GIFs, or a search, from
 * GIPHY through the API (which keeps the key and the safe rating). Picking
 * one sends it straight away and closes the menu.
 */
export function GifPickerButton({ onPick, disabled }: GifPickerButtonProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState<GifView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const open = anchor !== null;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    // Wait for typing to pause, so a search isn't sent per keystroke.
    const timer = setTimeout(
      async () => {
        setLoading(true);
        setError(null);
        const q = query.trim();
        const result = q ? await gifRepository.search(q) : await gifRepository.trending();
        if (cancelled) return;
        setLoading(false);
        if (result.ok) setGifs(result.value.results);
        else setError(result.message);
      },
      query ? SEARCH_DELAY_MS : 0,
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, query]);

  function close() {
    setAnchor(null);
    setQuery('');
  }

  return (
    <>
      <IconButton aria-label="GIF" disabled={disabled} onClick={(e) => setAnchor(e.currentTarget)}>
        <GifIcon />
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchor}
        onClose={close}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ width: 340, maxWidth: 'calc(100vw - 32px)', p: 1.5 }}>
          <TextField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search GIFs"
            size="small"
            fullWidth
            autoFocus
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Box sx={{ height: 320, overflowY: 'auto', mt: 1 }}>
            {error ? (
              <Alert severity="error">{error}</Alert>
            ) : loading && gifs.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
                <CircularProgress size={28} />
              </Box>
            ) : gifs.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', pt: 6 }}>
                No GIFs found.
              </Typography>
            ) : (
              <Box sx={{ columnCount: 2, columnGap: 1 }}>
                {gifs.map((gif) => (
                  <Box
                    key={gif.id}
                    component="button"
                    type="button"
                    onClick={() => {
                      onPick(gif);
                      close();
                    }}
                    aria-label={gif.title || 'GIF'}
                    sx={{
                      display: 'block',
                      width: '100%',
                      p: 0,
                      mb: 1,
                      border: 0,
                      borderRadius: 1,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      bgcolor: 'action.hover',
                      breakInside: 'avoid',
                    }}
                  >
                    <img
                      src={gif.previewUrl}
                      alt=""
                      loading="lazy"
                      style={{
                        display: 'block',
                        width: '100%',
                        aspectRatio: gif.width && gif.height ? `${gif.width} / ${gif.height}` : undefined,
                      }}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
          {/* GIPHY's terms ask for this attribution wherever their search is used. */}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>
            Powered by GIPHY
          </Typography>
        </Box>
      </Popover>
    </>
  );
}
