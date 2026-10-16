import { Alert, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { brand } from '../theme/theme';

interface DefaultSearchStatusProps {
  /** The search's error, else it's still running. */
  error: string | null;
  onRetry: () => void;
  loadingText: string;
}

/** While a page waits on the default search (see useDefaultSearch): a spinner, or the error with a retry. */
export function DefaultSearchStatus({ error, onRetry, loadingText }: DefaultSearchStatusProps) {
  if (error) {
    return (
      <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
        <Alert severity="error">{error}</Alert>
        <Button variant="outlined" onClick={onRetry}>
          Try again
        </Button>
      </Stack>
    );
  }
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
      <CircularProgress size={22} sx={{ color: brand.pitch }} />
      <Typography color="text.secondary">{loadingText}</Typography>
    </Stack>
  );
}
