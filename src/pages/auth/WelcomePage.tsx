import { Box, Button, Card, Container, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { BrandHeader } from '../../components/BrandHeader';
import { brand } from '../../theme/theme';

export function WelcomePage() {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        px: 2,
        py: 6,
        background: `radial-gradient(680px 260px at 88% -25%, rgba(111,199,138,.22), transparent 60%), linear-gradient(158deg, ${brand.void} 0%, ${brand.voidLight} 60%, ${brand.void} 130%)`,
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,.05) 0 1px, transparent 1px 72px)',
        },
      }}
    >
      <Container maxWidth="xs" sx={{ position: 'relative' }}>
        <Card sx={{ p: 4, borderRadius: 4, boxShadow: '0 24px 60px rgba(0,0,0,.35)' }}>
          <Stack spacing={5} sx={{ width: '100%' }}>
            <BrandHeader size={88} tagline="full" />
            <Stack spacing={2}>
              <Button variant="contained" size="large" onClick={() => navigate('/register')}>
                Create account
              </Button>
              <Button variant="outlined" size="large" onClick={() => navigate('/sign-in')}>
                Sign in
              </Button>
            </Stack>
          </Stack>
        </Card>
      </Container>
    </Box>
  );
}
