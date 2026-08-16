import { Box, Typography } from '@mui/material';
import { keyframes } from '@emotion/react';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

export function SplashScreen() {
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        bgcolor: 'secondary.main',
        zIndex: 2000,
      }}
    >
      <Box
        component="img"
        src="/icon-mark-reversed-transparent.png"
        alt="PitchMate"
        sx={{ width: 88, height: 88, objectFit: 'contain', animation: `${spin} 1.4s linear infinite` }}
      />
      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, letterSpacing: 0.5 }}>
        PitchMate
      </Typography>
    </Box>
  );
}
