import { useState } from 'react';
import { CircularProgress, Stack, TextField, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import { geocodePostcode, type GeocodeResult } from '../lib/geocodePostcode';

interface PostcodeLocationFieldProps {
  postcode: string;
  onPostcodeChange: (postcode: string) => void;
  coordinates: { longitude: number; latitude: number } | null;
  onCoordinatesChange: (coordinates: { longitude: number; latitude: number } | null) => void;
  label?: string;
}

/**
 * Replaces manual longitude/latitude entry with postcode-driven lookup via
 * postcodes.io - the user only ever types a real postcode. Looks up on blur
 * (and on Enter), and invalidates any resolved coordinates as soon as the
 * postcode text changes again so a stale location can never be submitted
 * silently alongside an edited postcode.
 */
export function PostcodeLocationField({
  postcode,
  onPostcodeChange,
  coordinates,
  onCoordinatesChange,
  label = 'Postcode',
}: PostcodeLocationFieldProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'found' | 'not-found'>('idle');
  const [outcode, setOutcode] = useState('');

  async function lookup() {
    if (!postcode.trim()) return;
    setStatus('loading');
    const result: GeocodeResult | null = await geocodePostcode(postcode);
    if (result) {
      onCoordinatesChange({ longitude: result.longitude, latitude: result.latitude });
      setOutcode(result.outcode);
      setStatus('found');
    } else {
      onCoordinatesChange(null);
      setStatus('not-found');
    }
  }

  function handlePostcodeChange(value: string) {
    onPostcodeChange(value);
    if (coordinates) onCoordinatesChange(null);
    if (status !== 'idle') setStatus('idle');
  }

  return (
    <Stack spacing={0.5}>
      <TextField
        label={label}
        value={postcode}
        onChange={(e) => handlePostcodeChange(e.target.value)}
        onBlur={lookup}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            lookup();
          }
        }}
        fullWidth
      />
      {status === 'loading' && (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <CircularProgress size={14} />
          <Typography variant="caption" color="text.secondary">
            Looking up postcode…
          </Typography>
        </Stack>
      )}
      {status === 'found' && (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 16 }} />
          <Typography variant="caption" color="text.secondary">
            Location found ({outcode || postcode.trim().toUpperCase()}).
          </Typography>
        </Stack>
      )}
      {status === 'not-found' && (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <ErrorOutlineIcon color="error" sx={{ fontSize: 16 }} />
          <Typography variant="caption" color="error">
            Couldn't find that postcode - check it and try again.
          </Typography>
        </Stack>
      )}
    </Stack>
  );
}
