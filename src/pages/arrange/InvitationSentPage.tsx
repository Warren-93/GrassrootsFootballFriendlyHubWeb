import { Box, Button, Container, Stack, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useNavigate, useParams } from 'react-router-dom';

export function InvitationSentPage() {
  const navigate = useNavigate();
  const { requestId } = useParams<{ requestId: string }>();

  return (
    <Container maxWidth="xs" sx={{ py: 8 }}>
      <Stack spacing={3} sx={{ alignItems: 'center', textAlign: 'center' }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            bgcolor: '#E4F4E4',
            color: 'primary.dark',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CheckIcon sx={{ fontSize: 32 }} />
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 400 }}>
          Invitation sent
        </Typography>
        <Typography variant="body2" color="text.secondary">
          We'll let you know as soon as they respond.
        </Typography>
        <Stack spacing={1.5} sx={{ width: '100%', maxWidth: 280 }}>
          <Button variant="contained" fullWidth onClick={() => navigate(`/request/${requestId}`)}>
            View request
          </Button>
          <Button variant="text" fullWidth onClick={() => navigate('/')}>
            Back to dashboard
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
