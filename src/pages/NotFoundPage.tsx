import { Button, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Stack spacing={2}>
        <Typography variant="h6">Page not found</Typography>
        <Typography variant="body2" color="text.secondary">
          That link doesn't go anywhere. It may be mistyped, or the page may have moved.
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/')}>
          Back to home
        </Button>
      </Stack>
    </Container>
  );
}
