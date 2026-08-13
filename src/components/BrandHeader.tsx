import { Box, Stack, Typography } from '@mui/material';

interface BrandHeaderProps {
  size?: number;
  tagline?: 'full' | 'compact' | 'none';
}

/** Icon + "PitchMate" wordmark, shared across the welcome, sign-in and register pages. */
export function BrandHeader({ size = 56, tagline = 'compact' }: BrandHeaderProps) {
  return (
    <Stack spacing={1} sx={{ alignItems: 'center', textAlign: 'center' }}>
      <Box component="img" src="/favicon.svg" alt="PitchMate" sx={{ width: size, height: size }} />
      <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 0.3 }}>
        <Box component="span" sx={{ color: 'secondary.main' }}>
          Pitch
        </Box>
        <Box component="span" sx={{ color: 'primary.main' }}>
          Mate
        </Box>
      </Typography>
      {tagline !== 'none' && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600, fontSize: 12 }}
        >
          Find. Match. Play.
        </Typography>
      )}
      {tagline === 'full' && (
        <Typography variant="caption" color="text.secondary">
          Friendlies made easy
        </Typography>
      )}
    </Stack>
  );
}
