import { Box, Button, Container, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { BrandHeader } from '../../components/BrandHeader';

export function WelcomePage() {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(180deg, #EAF7EE 0%, #FFFFFF 55%)',
      }}
    >
      <Container maxWidth="xs">
        <Stack spacing={6} sx={{ width: '100%' }}>
          <BrandHeader size={96} tagline="full" />
          <Stack spacing={2}>
            <Button variant="contained" size="large" onClick={() => navigate('/register')}>
              Create account
            </Button>
            <Button variant="outlined" size="large" onClick={() => navigate('/sign-in')}>
              Sign in
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
