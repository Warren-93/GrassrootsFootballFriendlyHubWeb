import { Button, Container, Stack, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';

export function InvitationSentPage() {
  const navigate = useNavigate();
  const { requestId } = useParams<{ requestId: string }>();

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Invitation sent
        </Typography>
        <Typography variant="body2" color="text.secondary">
          We'll let you know when they respond.
        </Typography>
        <Button variant="contained" onClick={() => navigate(`/request/${requestId}`)}>
          View request
        </Button>
        <Button variant="text" onClick={() => navigate('/')}>
          Back to dashboard
        </Button>
      </Stack>
    </Container>
  );
}
