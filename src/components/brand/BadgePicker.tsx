import { useRef, useState } from 'react';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { CrestAvatar } from './CrestAvatar';

const BADGE_SIZE = 256;

/** Reads an image file and returns it as a square JPEG data URL, at most 256px, so it fits in the team record. */
async function toBadgeDataUrl(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('unreadable'));
      el.src = url;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = Math.min(BADGE_SIZE, side);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no canvas');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      img,
      (img.naturalWidth - side) / 2,
      (img.naturalHeight - side) / 2,
      side,
      side,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    return canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

interface BadgePickerProps {
  name: string;
  value: string | null;
  onChange: (value: string | null) => void;
}

/** Upload, preview and remove a team or club badge. */
export function BadgePicker({ name, value, onChange }: BadgePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      onChange(await toBadgeDataUrl(file));
    } catch {
      setError("That file couldn't be read as an image.");
    }
  }

  return (
    <Stack spacing={1}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        Badge
      </Typography>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <CrestAvatar name={name} src={value} size={56} />
        <Button variant="outlined" size="small" onClick={() => inputRef.current?.click()}>
          {value ? 'Change' : 'Upload'}
        </Button>
        {value && (
          <Button variant="text" size="small" color="inherit" onClick={() => onChange('')}>
            Remove
          </Button>
        )}
        <Box
          component="input"
          ref={inputRef}
          type="file"
          accept="image/*"
          sx={{ display: 'none' }}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            void handleFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
    </Stack>
  );
}
