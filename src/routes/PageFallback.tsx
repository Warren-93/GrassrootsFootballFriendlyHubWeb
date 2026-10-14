import { Box, CircularProgress } from '@mui/material';

/** Shown while a page's code chunk downloads. */
export function PageFallback() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress />
    </Box>
  );
}
