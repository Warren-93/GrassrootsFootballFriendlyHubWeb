import { createTheme } from '@mui/material/styles';

// PitchMate brand palette - green from the pin mark, navy from the pitch
// base and wordmark.
export const theme = createTheme({
  palette: {
    primary: { main: '#2E9E52', dark: '#1E8E42', light: '#34B85B' },
    secondary: { main: '#14213D' },
    error: { main: '#C62828' },
    warning: { main: '#FFA000' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});
