import { Button, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export function PlaceholderPage({ label }: { label: string }) {
  const navigate = useNavigate();
  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Stack spacing={2}>
        <Typography variant="h6">{label}</Typography>
        <Typography variant="body2" color="text.secondary">
          This screen isn't built yet.
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/')}>
          Back to dashboard
        </Button>
      </Stack>
    </Container>
  );
}
