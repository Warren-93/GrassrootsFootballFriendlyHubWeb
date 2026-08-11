import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export function WelcomePage() {
  const navigate = useNavigate();
  return (
    <Container maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
      <Stack spacing={3} sx={{ width: '100%' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Grassroots Football Friendly Hub
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Find, arrange and confirm friendlies for your team.
          </Typography>
        </Box>
        <Button variant="contained" size="large" onClick={() => navigate('/register')}>
          Create account
        </Button>
        <Button variant="outlined" size="large" onClick={() => navigate('/sign-in')}>
          Sign in
        </Button>
      </Stack>
    </Container>
  );
}
